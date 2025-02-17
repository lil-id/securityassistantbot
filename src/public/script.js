document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const number = document.getElementById('numberInput').value;
    alert(`Logged in with number: ${number}`);
});