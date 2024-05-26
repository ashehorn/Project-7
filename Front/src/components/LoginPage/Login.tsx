import React, { useState } from 'react';
import './login.css';

export default function Login() {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const data = {
            email: formData.get('email'),
            password: formData.get('password'),
        };
        
        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                // Need to get the token from cookie and add it to the request header.
            });
            const result = await response.json();
            if (response.ok) {
                window.location.href = 'http://localhost:5173/feed';
            } else {
                setErrorMessage(result.error || 'Login failed. Please check your credentials and try again.');
            }
        } catch (error) {
            setErrorMessage('An error occurred. Please try again.');
            console.error(error);
        }
    }

    function redirect() {
        window.location.href = 'http://localhost:5173/register';
    }

    return (
        <div className="login">
            <form className='loginForm' method="post" onSubmit={handleSubmit}>
                <input className="email" name="email" type="email" placeholder='Email' required />
                <input className="password" name="password" type="password" placeholder='Password' required />
                <div className='button-group'>
                    <button className="loginBtn" type="submit">Login</button>
                    <button className="registerBtn" type="button" onClick={redirect}>Register</button>
                </div>
            </form>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
        </div>
    );
}

