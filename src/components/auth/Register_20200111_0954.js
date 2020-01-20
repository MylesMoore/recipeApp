import React, { Component } from 'react';
import FormErrors from "../FormErrors";
import Validate from "../utility/FormValidation";
import { Auth } from "aws-amplify";
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { 
  Form, FormGroup, FormFeedback, FormText,
  Input,
  Label
} from 'reactstrap';

const config = require('../../config.json');

class Register extends Component {
  state = {
    username: "",
    email: "",
    password: "",
    confirmpassword: "",
    userId: "",
    errors: {
      cognito: null,
      blankfield: false,
      passwordmatch: false
    }
  }

  clearErrorState = () => {
    this.setState({
      errors: {
        cognito: null,
        blankfield: false,
        passwordmatch: false
      }
    });
  }

  handleSubmit = async event => {
    event.preventDefault();

    // Form validation
    this.clearErrorState();
    const error = Validate(event, this.state);
    if (error) {
      this.setState({
        errors: { ...this.state.errors, ...error }
      });
    }

    // AWS Cognito integration here
    const { username, email, password } = this.state;
    try {
      const signUpResponse = await Auth.signUp({
        username, 
        password,  
        attributes: {
          email: email
        }
      });
      console.dir(`signUpResponse: ${signUpResponse}`);
      console.dir(signUpResponse);
      this.setState({userId: signUpResponse.userSub});
      console.dir(`UserID: ${this.state.userId}`);
    } catch (error) {
      let err = null;
      !error.message ? err = { "message": error } : err = err;
      
      this.setState({
        errors: {
          ...this.state.errors,
          cognito: error
        }
      });
      console.dir(error);
    }
    
    // initialize user in database
    try {
      const params = {
        "userId": this.state.userId,
        "sett": null
      };                                       
      await axios.patch(`${config.api.invokeUrl}/user/configsettings`, params);
      this.props.history.push("/welcome");
    }catch (err) {
      console.log(`An error has occurred while initializing user: ${err}`);
    }
  };

  onInputChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
    document.getElementById(event.target.id).classList.remove("is-danger");
  }

  render() {
    return (
      <section className="section auth">
        <div className="container">
          <h1>Register</h1>
          <FormErrors formerrors={this.state.errors} />

          <form onSubmit={this.handleSubmit}>
            <div className="field">
              <p className="control">
                <input 
                  className="input" 
                  type="text"
                  id="username"
                  aria-describedby="userNameHelp"
                  placeholder="Enter username"
                  value={this.state.username}
                  onChange={this.onInputChange}
                />
              </p>
            </div>
            <div className="field">
              <p className="control has-icons-left has-icons-right">
                <input 
                  className="input" 
                  type="email"
                  id="email"
                  aria-describedby="emailHelp"
                  placeholder="Enter email"
                  value={this.state.email}
                  onChange={this.onInputChange}
                />
                <span className="icon is-small is-left">
                  <i className="fas fa-envelope"></i>
                </span>
              </p>
            </div>
            <div className="field">
              <p className="control has-icons-left">
                <input 
                  className="input" 
                  type="password"
                  id="password"
                  placeholder="Password"
                  value={this.state.password}
                  onChange={this.onInputChange}
                />
                <span className="icon is-small is-left">
                  <i className="fas fa-lock"></i>
                </span>
              </p>
            </div>
            <div className="field">
              <p className="control has-icons-left">
                <input 
                  className="input" 
                  type="password"
                  id="confirmpassword"
                  placeholder="Confirm password"
                  value={this.state.confirmpassword}
                  onChange={this.onInputChange}
                />
                <span className="icon is-small is-left">
                  <i className="fas fa-lock"></i>
                </span>
              </p>
            </div>
            <div>
              <p>Password must be:</p>
              <ul>
                <li>Between 6 and 99 characters.</li>
                <li>At least one number required.</li>
                <li>At least one number required.</li>
                <li>At least one uppercase letter required.</li>
                <li>At least one lowercase letter required.</li>
                <li>{'At least one of the following: ^ $ * . [ ] { } ( ) ? - " ! @ # % & / \ , > < \u0027 : ; | _ ~ `'}</li>
              </ul>
            </div>
            <div className="field">
              <p className="control">
                <a href="/forgotpassword">Forgot password?</a>
              </p>
            </div>
            <div className="field">
              <p className="control">
                <button className="button is-success">
                  Register
                </button>
              </p>
            </div>
          </form>
        </div>
      </section>
    );
  }
}

export default Register;