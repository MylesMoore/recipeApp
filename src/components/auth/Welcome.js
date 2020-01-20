import React from 'react';

export default function Welcome() {
  return (
    <section className="section auth">
      <div className="container">
        <h1>Welcome!</h1>
        <p>You have successfully registered a new account.</p>
        <p>We've sent you a confirmation email.  Follow the link in that email to confirm your account, then return to this page to <a href="/login">log in.</a></p>
      </div>
    </section>
  )
}
