import React, { useState } from 'react';
import './register.css';

export default function Register() {
    const [responseMessage, setResponseMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (form) {
            const formData = new FormData(form);
            const data = {
                first_name: formData.get('fname'),
                last_name: formData.get('lname'),
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password'),
            };

            try {
                const response = await fetch('http://localhost:3000/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                    credentials: 'include',
                });
                const result = await response.json();
                if (response.ok) {
                    setResponseMessage(result.message || 'Registration successful!');
                    setErrorMessage(null);
                    localStorage.setItem('userId', result.user.id);
                    window.location.href = 'http://localhost:5173/';
                } else {
                    setErrorMessage(result.error || 'Registration failed.');
                    setResponseMessage(null);
                }
            } catch (error) {
                setErrorMessage('An error occurred. Please try again.');
                setResponseMessage(null);
                console.error(error);
            }
        }
    };

    return (
        <div className='register'>
            <h1>Register</h1>
            <form className='register-form' method='post' onSubmit={handleSubmit}>
                <input className='reg-input' type="text" name='fname' placeholder='First Name' required />
                <input className='reg-input' type="text" name='lname' placeholder='Last Name' required />
                <input className='reg-input' type='text' name='username' placeholder='Username' required />
                <input className='reg-input' type='email' name='email' placeholder='Email' required />
                <input className='reg-input' type='password' name='password' placeholder='Password' required />
                <button className="submit" type="submit">Submit</button>
            </form>
            {responseMessage && <div className="success-message">{responseMessage}</div>}
            {errorMessage && <div className="error-message">{errorMessage}</div>}
        </div>
    );
}