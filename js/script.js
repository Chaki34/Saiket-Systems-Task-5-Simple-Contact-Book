
const contactForm = document.getElementById("contactForm");
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const emailInput = document.getElementById("email");

const searchInput = document.getElementById("searchInput");
const contactList = document.getElementById("contactList");
const contactCount = document.getElementById("contactCount");
const emptyState = document.getElementById("emptyState");
const messageBox = document.getElementById("message");

// Load previously saved contacts from the browser.
let contacts = loadContacts();

// Display saved contacts when the page opens.
displayContacts(contacts);


// Read contacts from Local Storage safely.
function loadContacts() {
    try {
        const savedContacts = localStorage.getItem("contactBookContacts");

        if (!savedContacts) {
            return [];
        }

        const parsedContacts = JSON.parse(savedContacts);

        if (!Array.isArray(parsedContacts)) {
            return [];
        }

        // Ignore incomplete or invalid saved entries.
        return parsedContacts.filter((contact) =>
            contact &&
            typeof contact.id === "string" &&
            typeof contact.name === "string" &&
            typeof contact.phone === "string" &&
            typeof contact.email === "string"
        );
    } catch (error) {
        console.error("Could not load saved contacts:", error);
        return [];
    }
}


// Save the current contacts in Local Storage.
function saveContacts() {
    try {
        localStorage.setItem(
            "contactBookContacts",
            JSON.stringify(contacts)
        );

        return true;
    } catch (error) {
        console.error("Could not save contacts:", error);
        showMessage(
            "Contacts could not be saved in this browser.",
            "danger"
        );

        return false;
    }
}


// Show a temporary message to the user.
function showMessage(message, type = "success") {
    messageBox.textContent = message;
    messageBox.className = `alert alert-${type}`;
}


// Hide the message when the user starts entering a new contact.
contactForm.addEventListener("input", () => {
    messageBox.classList.add("d-none");
});


// Add a new contact.
contactForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const email = emailInput.value.trim();

    // Basic form validation.
    if (!name || !phone || !email) {
        showMessage("Please fill in all three fields.", "warning");
        return;
    }

    // Allow common phone number characters.
    const phonePattern = /^[0-9+\-().\s]{7,20}$/;

    if (!phonePattern.test(phone)) {
        showMessage(
            "Please enter a valid phone number.",
            "warning"
        );
        phoneInput.focus();
        return;
    }

    // The browser also validates the email field.
    if (!emailInput.checkValidity()) {
        showMessage(
            "Please enter a valid email address.",
            "warning"
        );
        emailInput.focus();
        return;
    }

    // Create a new contact object.
    const newContact = {
        id: createContactId(),
        name: name,
        phone: phone,
        email: email
    };

    // Add the contact to the array.
    contacts.push(newContact);

    // Save before showing the successful result.
    if (!saveContacts()) {
        contacts.pop();
        return;
    }

    // Refresh the contact list.
    displayContacts(getFilteredContacts());

    // Clear the form after successful submission.
    contactForm.reset();

    showMessage("Contact added successfully!", "success");
});


// Create a unique ID for each contact.
function createContactId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return Date.now().toString() + "-" +
        Math.random().toString(36).slice(2);
}


// Return contacts matching the current search.
function getFilteredContacts() {
    const searchText = searchInput.value.trim().toLowerCase();

    return contacts.filter((contact) =>
        contact.name.toLowerCase().includes(searchText)
    );
}


// Search contacts as the user types.
searchInput.addEventListener("input", function () {
    displayContacts(getFilteredContacts());
});


// Display contacts on the page.
function displayContacts(contactArray) {
    // Remove the previous results.
    contactList.replaceChildren();

    // The count shows the total number of saved contacts.
    contactCount.textContent = contacts.length;

    // Display an appropriate empty state.
    if (contactArray.length === 0) {
        emptyState.classList.remove("d-none");

        const heading = emptyState.querySelector("h5");
        const description = emptyState.querySelector("p");

        if (contacts.length === 0) {
            heading.textContent = "No contacts yet";
            description.textContent =
                "Add your first contact using the form.";
        } else {
            heading.textContent = "No matching contacts";
            description.textContent =
                "Try searching with another name.";
        }

        return;
    }

    emptyState.classList.add("d-none");

    // Create one card for each contact.
    contactArray.forEach((contact) => {
        const contactCard = document.createElement("div");
        contactCard.className = "contact-item";

        const contactInfo = document.createElement("div");
        contactInfo.className = "contact-info";

        // Avatar with the first letter of the name.
        const avatar = document.createElement("div");
        avatar.className = "contact-avatar";
        avatar.textContent = contact.name.charAt(0).toUpperCase();

        const details = document.createElement("div");
        details.className = "contact-details";

        const name = document.createElement("h6");
        name.className = "contact-name";
        name.textContent = contact.name;

        const phone = document.createElement("p");
        phone.className = "contact-detail";

        const phoneIcon = document.createElement("i");
        phoneIcon.className = "bi bi-telephone me-1";

        phone.append(phoneIcon, document.createTextNode(contact.phone));

        const email = document.createElement("p");
        email.className = "contact-detail";

        const emailIcon = document.createElement("i");
        emailIcon.className = "bi bi-envelope me-1";

        email.append(emailIcon, document.createTextNode(contact.email));

        details.append(name, phone, email);
        contactInfo.append(avatar, details);

        // Delete button.
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-btn";
        deleteButton.title = "Delete contact";
        deleteButton.setAttribute(
            "aria-label",
            `Delete contact ${contact.name}`
        );

        const deleteIcon = document.createElement("i");
        deleteIcon.className = "bi bi-trash";

        deleteButton.appendChild(deleteIcon);

        // Delete only the selected contact.
        deleteButton.addEventListener("click", function () {
            deleteContact(contact.id);
        });

        contactCard.append(contactInfo, deleteButton);
        contactList.appendChild(contactCard);
    });
}


// Delete a contact using its unique ID.
function deleteContact(contactId) {
    const contactToDelete = contacts.find(
        (contact) => contact.id === contactId
    );

    if (!contactToDelete) {
        return;
    }

    const confirmed = window.confirm(
        `Are you sure you want to delete ${contactToDelete.name}?`
    );

    if (!confirmed) {
        return;
    }

    const previousContacts = contacts;

    contacts = contacts.filter(
        (contact) => contact.id !== contactId
    );

    // Restore the old list if saving fails.
    if (!saveContacts()) {
        contacts = previousContacts;
        return;
    }

    displayContacts(getFilteredContacts());

    showMessage("Contact deleted successfully.", "success");
}
