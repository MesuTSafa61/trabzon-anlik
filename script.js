// TRABZON ANLIK
// İlk etkileşimler

const menuButton = document.querySelector(".menu-button");
const searchButton = document.querySelector(".search-box button");
const searchInput = document.querySelector(".search-box input");

// Mobil menü
menuButton.addEventListener("click", () => {
    alert("Mobil menü bir sonraki aşamada aktif olacak.");
});

// Arama
searchButton.addEventListener("click", () => {
    const searchText = searchInput.value.trim();

    if (!searchText) {
        alert("Lütfen aramak istediğiniz şeyi yazın.");
        searchInput.focus();
        return;
    }

    alert(`“${searchText}” için arama sistemi yakında aktif olacak.`);
});

// Enter ile arama
searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        searchButton.click();
    }
});
