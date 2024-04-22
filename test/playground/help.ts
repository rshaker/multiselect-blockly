const helpOnStartKey = "helpOnStart";
const rememberCheckbox = document.getElementById("remember-checkbox") as HTMLInputElement;
rememberCheckbox.addEventListener("change", () => {
    if (rememberCheckbox.checked) {
        localStorage.setItem(helpOnStartKey, "true");
    } else {
        localStorage.removeItem(helpOnStartKey);
    }
});

const dialog = document.getElementById("help-dialog") as HTMLDialogElement;
if (localStorage.getItem(helpOnStartKey) === null) {
    dialog.showModal();
}
