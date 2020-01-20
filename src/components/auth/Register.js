import React, { Component } from 'react';
import FormErrors from "../FormErrors";
import Validate from "../utility/FormValidation";
import { Auth } from "aws-amplify";
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { 
  Button,
  Container,
  Form, FormGroup, FormFeedback, FormText,
  Input,
  Label,
  Row
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
    

  };

  onInputChange = event => {
    let str = event.target.value;
    this.setState({
      [event.target.id]: str.toLowerCase()
    });
  }
  
  onInputChangePassword = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
  }

  render() {
    return (
      <Container>
        <h1>Register</h1>
        
        <FormErrors formerrors={this.state.errors} />

        <Form onSubmit={this.handleSubmit}>
          <FormGroup>
            <Input 
                type="text"
                id="username"
                placeholder="Enter username"
                value={this.state.username}
                onChange={this.onInputChange}
                required
                pattern="\S+"
                title="Username can not contain spaces."
              />
          </FormGroup>
          <FormGroup>
          <span>
            <Input 
                type="email"
                id="email"
                placeholder="Enter email"
                value={this.state.email}
                onChange={this.onInputChange}
                required
              >
            </Input>
          </span>
          </FormGroup>
          <FormGroup>
            <Input 
                type="password"
                id="password"
                placeholder="Enter password"
                value={this.state.password}
                onChange={this.onInputChangePassword}
                required
              />
          </FormGroup>
          <FormGroup>
            <Input 
                type="password"
                id="confirmpassword"
                placeholder="Confirm password"
                value={this.state.confirmpassword}
                onChange={this.onInputChangePassword}
                required
                invalid={this.state.confirmpassword !== this.state.password}
                
              />
              <FormFeedback invalid>Passwords do not match</FormFeedback>
            <FormText color="muted">
              <p>Password must be:</p>
              <ul>
                <li>Between 6 and 99 characters.</li>
                <li>At least one number required.</li>
                <li>At least one number required.</li>
                <li>At least one uppercase letter required.</li>
                <li>At least one lowercase letter required.</li>
                <li>{'At least one of the following: ^ $ * . [ ] { } ( ) ? - " ! @ # % & / \ , > < \u0027 : ; | _ ~ `'}</li>
              </ul>
            </FormText>
          </FormGroup>
          <Button type="submit">Register</Button>
          <p><a type="link" href="/forgotpassword">Forgot password?</a></p>
        </Form>
      </Container>
    );
  }
}

export default Register;