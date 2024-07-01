import React, { useState } from 'react';
import Logo from '../../assets/Groupomania_Logos/icon.svg'
import './authForm.scss';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>, type: 'login' | 'register') {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const data: { [key: string]: FormDataEntryValue | null } = {
      email: formData.get('email'),
      password: formData.get('password'),
    };

    if (type === 'register') {
      data['first_name'] = formData.get('fname');
      data['last_name'] = formData.get('lname');
      data['username'] = formData.get('username');
    }

    try {
      const url = type === 'login' ? 'http://localhost:3000/api/auth/login' : 'http://localhost:3000/api/auth/register';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      const result = await response.json();
      if (response.ok) {
        localStorage.setItem('userId', result.userId);
        if (type === 'login') {
          window.location.href = 'http://localhost:5173/dashboard';
        } else {
          setResponseMessage(result.message || 'Registration successful!');
          setErrorMessage(null);
          setTimeout(() => {
            setIsLogin(true); 
          }, 2000); 
        }
      } else {
        setErrorMessage(result.error || `${type === 'login' ? 'Login' : 'Registration'} failed. Please check your credentials and try again.`);
        setResponseMessage(null);
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      setResponseMessage(null);
      console.error(error);
    }
  }

  return (
    <div className="auth">
      <div className={isLogin ? "login" : "register"}>
        <h1>{isLogin ? 'Login' : 'Register'}</h1>
        <Logo/>
        <form
          className={isLogin ? 'login-form' : 'register-form'}
          method="post"
          onSubmit={(event) => handleSubmit(event, isLogin ? 'login' : 'register')}
        >
          {!isLogin && (
            <>
              <input className="reg-input" type="text" name="fname" placeholder="First Name" required />
              <input className="reg-input" type="text" name="lname" placeholder="Last Name" required />
              <input className="reg-input" type="text" name="username" placeholder="Username" required />
            </>
          )}
          <input className="reg-input" name="email" type="email" placeholder="Email" required />
          <input className="reg-input" name="password" type="password" placeholder="Password" required />
          <div className="button-group">
            <button className="submit" type="submit">{isLogin ? 'Login' : 'Register'}</button>
            {isLogin && (
              <button
                className="toggleBtn"
                type="button"
                onClick={() => setIsLogin(!isLogin)}
              >
                Register
              </button>
            )}
          </div>
        </form>
        {responseMessage && <div className="success-message">{responseMessage}</div>}
        {errorMessage && <div className="error-message">{errorMessage}</div>}
      </div>
    </div>
  );
}
