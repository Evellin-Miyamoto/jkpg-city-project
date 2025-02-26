let currentUser = null;
let stores = [];
let districts = [];

//DOM Elements
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const userInfo = document.getElementById("user-info");
const storesList = document.getElementById("stores-list");
const searchInput = document.getElementById("search");
const districtFilter = document.getElementById("district-filter");
const sortBy = document.getElementById("sort-by");
const adminControls = document.getElementById("admin-controls");
const storeForm = document.getElementById("store-form");
const addEditStoreForm = document.getElementById("add-edit-store-form");

//authentication functions
function showRegister() {
  loginForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
}

function showLogin() {
  registerForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
}

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const data = await response.json();
    currentUser = data.user;
    localStorage.setItem("token", data.token);

    updateAuthUI();
    loadStores();
  } catch (error) {
    alert(error.message);
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("token");
  updateAuthUI();
  loadStores();
}

function updateAuthUI() {
  if (currentUser) {
    loginForm.classList.add("hidden");
    registerForm.classList.add("hidden");
    userInfo.classList.remove("hidden");
    document.getElementById(
      "user-welcome"
    ).textContent = `Welcome, ${currentUser.username}!`;
    if (currentUser.is_admin) {
      adminControls.classList.remove("hidden");
    } else {
      adminControls.classList.add("hidden");
    }
  } else {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    userInfo.classList.add("hidden");
    adminControls.classList.add("hidden");
  }
}

async function loadStores() {
  try {
    const response = await fetch("/api/stores");
    stores = await response.json();
    await loadDistricts();
    displayStores(stores);
  } catch (error) {
    console.error("Error loading stores:", error);
  }
}

async function loadDistricts() {
  try {
    const response = await fetch("/api/districts");
    districts = await response.json();
    updateDistrictFilters(districts);
  } catch (error) {
    console.error("Error loading districts:", error);
  }
}

function updateDistrictFilters(districts) {
  const filterSelect = document.getElementById("district-filter");
  filterSelect.innerHTML = '<option value="">All Districts</option>';

  const formSelect = document.getElementById("district");
  formSelect.innerHTML = '<option value="">Select District</option>';

  districts.forEach((district) => {
    if (district) {
      const filterOption = new Option(district, district);
      const formOption = new Option(district, district);
      filterSelect.add(filterOption);
      formSelect.add(formOption);
    }
  });
}

function displayStores(storesToShow) {
  storesList.innerHTML = "";
  storesToShow.forEach((store) => {
    const card = document.createElement("div");
    card.className = "store-card";

    //format the URL properly
    let formattedUrl = store.url;
    if (formattedUrl && !formattedUrl.startsWith("http")) {
      formattedUrl = "https://" + formattedUrl;
    }

    card.innerHTML = `
      <h3>${store.name}</h3>
      ${store.district ? `<p>District: ${store.district}</p>` : ""}
      ${
        formattedUrl
          ? `<p><a href="${formattedUrl}" target="_blank">Visit Website</a></p>`
          : ""
      }
      ${
        currentUser?.is_admin
          ? `
          <div class="admin-actions">
              <button onclick="editStore(${store.id})" class="secondary">Edit</button>
              <button onclick="deleteStore(${store.id})" class="danger">Delete</button>
          </div>
      `
          : ""
      }
    `;
    storesList.appendChild(card);
  });
}

//search and filter
searchInput.addEventListener("input", filterStores);
districtFilter.addEventListener("change", filterStores);
sortBy.addEventListener("change", filterStores);

function filterStores() {
  let filtered = [...stores];

  //search filter
  const searchTerm = searchInput.value.toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter((store) =>
      store.name.toLowerCase().includes(searchTerm)
    );
  }

  //district filter
  const selectedDistrict = districtFilter.value;
  if (selectedDistrict) {
    filtered = filtered.filter((store) => store.district === selectedDistrict);
  }
  //sorting
  const sortValue = sortBy.value;
  filtered.sort((a, b) => {
    if (sortValue === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortValue === "district") {
      return (a.district || "").localeCompare(b.district || "");
    }
  });

  displayStores(filtered);
}

function showAddStoreForm() {
  document.getElementById("form-title").textContent = "Add New Store";
  addEditStoreForm.reset();
  storeForm.classList.remove("hidden");
}

function showStoreForm() {
  const storeFormModal = document.getElementById("store-form");
  storeFormModal.classList.remove("hidden");
  storeFormModal.classList.add("show");

  // load districts in the dropdown
  loadDistricts();
}

function hideStoreForm() {
  const storeFormModal = document.getElementById("store-form");
  storeFormModal.classList.remove("show");
  storeFormModal.classList.add("hidden");
  document.getElementById("add-edit-store-form").reset();
}

async function addStore(event) {
  event.preventDefault();

  const formData = new FormData(event.target);

  //to fix the websites problems
  let url = formData.get("url");
  if (url && !url.startsWith("http")) {
    url = "https://" + url;
  }

  const storeData = {
    name: formData.get("name"),
    url: url,
    district: formData.get("district"),
    description: formData.get("description"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    categories: formData.get("categories")
      ? formData
          .get("categories")
          .split(",")
          .map((cat) => cat.trim())
      : [],
  };

  try {
    const response = await fetch("/api/stores", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(storeData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to add store");
    }

    const newStore = await response.json();
    alert("Store added successfully!");

    //reset form and refresh stores list
    hideStoreForm();
    await loadStores();
  } catch (error) {
    alert(error.message);
  }
}

//event listener for the store form
document
  .getElementById("add-edit-store-form")
  .addEventListener("submit", addStore);

loadStores();
