document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const role = document.getElementById('role').value;
    const phone = document.getElementById('phone').value;

    const endpoint = role === 'admin' ? '/api/v1/admins/login' : '/api/v1/users/login';

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ numberPhone: phone })
    });

    if (response.ok) {
        alert('Login successful');
        window.location.href = '/dashboard';
    } else {
        alert('Login failed');
    }
});