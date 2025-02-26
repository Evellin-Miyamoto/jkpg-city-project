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
      throw new Error(error.message || "Login failed");
    }

    const data = await response.json();
    currentUser = data.user;
    localStorage.setItem("token", data.token);

    // Update UI
    showUserInfo();
    if (currentUser.is_admin) {
      document.getElementById("admin-controls").classList.remove("hidden");
    }
  } catch (error) {
    alert(error.message);
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("token");
  document.getElementById("login-form").classList.remove("hidden");
  document.getElementById("user-info").classList.add("hidden");
  document.getElementById("admin-controls").classList.add("hidden");
}

function showUserInfo() {
  document.getElementById("login-form").classList.add("hidden");
  document.getElementById("register-form").classList.add("hidden");
  document.getElementById("user-info").classList.remove("hidden");
  document.getElementById(
    "user-welcome"
  ).textContent = `Welcome, ${currentUser.username}!`;
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
  const formSelect = document.getElementById("store-district");

  filterSelect.innerHTML = '<option value="">All Districts</option>';
  formSelect.innerHTML = '<option value="">Select District</option>';

  districts.forEach((district) => {
    if (district) {
      //only add non-null districts
      filterSelect.add(new Option(district, district));
      formSelect.add(new Option(district, district));
    }
  });
}

function displayStores(storesToShow) {
  storesList.innerHTML = "";
  storesToShow.forEach((store) => {
    const card = document.createElement("div");
    card.className = "store-card";
    card.innerHTML = `
            <h3>${store.name}</h3>
            ${store.district ? `<p>District: ${store.district}</p>` : ""}
            ${
              store.url
                ? `<p><a href="${store.url}" target="_blank">Visit Website</a></p>`
                : ""
            }
            ${
              currentUser?.isAdmin
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

function hideStoreForm() {
  storeForm.classList.add("hidden");
  addEditStoreForm.reset();
}

addEditStoreForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = {
    name: document.getElementById("store-name").value,
    url: document.getElementById("store-url").value,
    district: document.getElementById("store-district").value,
    phone: document.getElementById("store-phone").value,
    email: document.getElementById("store-email").value,
    address: document.getElementById("store-address").value,
    description: document.getElementById("store-description").value,
  };

  console.log("Store form submitted:", formData);
  hideStoreForm();
});

async function register() {
  const username = document.getElementById("reg-username").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registration failed");
    }

    alert("Registration successful! Please login.");
    showLogin();
  } catch (error) {
    alert(error.message);
  }
}

// Check for existing login on page load
window.addEventListener("load", () => {
  const token = localStorage.getItem("token");
  if (token) {
    // Verify token and get user info
    fetch("/api/auth/verify", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.user) {
          currentUser = data.user;
          showUserInfo();
          if (currentUser.is_admin) {
            document
              .getElementById("admin-controls")
              .classList.remove("hidden");
          }
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
      });
  }
});

loadStores();
