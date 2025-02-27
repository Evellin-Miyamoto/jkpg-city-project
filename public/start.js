let currentUser = null;
let stores = [];
let districts = [];

//DOM Elements
const loginForm = document.getElementById("login-form");
const userInfo = document.getElementById("user-info");
const storesList = document.getElementById("stores-list");
const searchInput = document.getElementById("search");
const districtFilter = document.getElementById("district-filter");
const sortBy = document.getElementById("sort-by");
const adminControls = document.getElementById("admin-controls");
const storeForm = document.getElementById("store-form");
const addEditStoreForm = document.getElementById("add-edit-store-form");

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
  addEditStoreForm.removeAttribute("data-store-id");
  storeForm.classList.remove("hidden");
}

function showEditStoreForm(store) {
  document.getElementById("form-title").textContent = "Edit Store";
  const form = document.getElementById("add-edit-store-form");

  //fill the form with store data
  form.elements["name"].value = store.name || "";
  form.elements["url"].value = store.url || "";
  form.elements["district"].value = store.district || "";
  form.elements["description"].value = store.description || "";
  form.elements["phone"].value = store.phone || "";
  form.elements["email"].value = store.email || "";
  form.elements["address"].value = store.address || "";

  form.setAttribute("data-store-id", store.id);

  storeForm.classList.remove("hidden");
  storeForm.classList.add("show");

  form.querySelector("button[type='submit']").textContent = "Update Store";
}

async function editStore(storeId) {
  try {
    const response = await fetch(`/api/stores/${storeId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch store details");
    }
    const store = await response.json();
    showEditStoreForm(store);
  } catch (error) {
    alert(error.message);
  }
}

async function deleteStore(storeId) {
  if (!confirm("Are you sure you want to delete this store?")) {
    return;
  }

  try {
    const response = await fetch(`/api/stores/${storeId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete store");
    }

    alert("Store deleted successfully!");
    await loadStores();
  } catch (error) {
    alert(error.message);
  }
}

async function handleStoreSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const storeId = event.target.getAttribute("data-store-id");

  //format URL if provided
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
  };

  try {
    const method = storeId ? "PUT" : "POST";
    const url = storeId ? `/api/stores/${storeId}` : "/api/stores";

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(storeData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error || `Failed to ${storeId ? "update" : "add"} store`
      );
    }

    const newStore = await response.json();
    alert(`Store ${storeId ? "updated" : "added"} successfully!`);

    //reset form and refresh storeslist
    hideStoreForm();
    await loadStores();
  } catch (error) {
    alert(error.message);
  }
}

//update the form event listener
document
  .getElementById("add-edit-store-form")
  .addEventListener("submit", handleStoreSubmit);

function showStoreForm() {
  const storeFormModal = document.getElementById("store-form");
  storeFormModal.classList.remove("hidden");
  storeFormModal.classList.add("show");

  loadDistricts();
}

function hideStoreForm() {
  const storeFormModal = document.getElementById("store-form");
  storeFormModal.classList.remove("show");
  storeFormModal.classList.add("hidden");
  document.getElementById("add-edit-store-form").reset();
}

loadStores();
