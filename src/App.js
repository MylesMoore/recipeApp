import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import './App.css';
import MainNavbar from './components/Navbar';
import Home from './components/Home';
import Products from './components/Products';
import ProductAdmin from './components/ProductAdmin';
import LogIn from './components/auth/LogIn';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ForgotPasswordVerification from './components/auth/ForgotPasswordVerification';
import ChangePassword from './components/auth/ChangePassword';
import ChangePasswordConfirm from './components/auth/ChangePasswordConfirm';
import Welcome from './components/auth/Welcome';
import Ingredients from './components/Ingredients';
import Recipes from './components/Recipes';
import Footer from './components/Footer';
import { Auth } from 'aws-amplify';
import axios from 'axios';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCheckSquare, faCoffee, faEdit } from '@fortawesome/free-solid-svg-icons';

library.add( faCheckSquare, faCoffee, faEdit);

const config = require('./config.json');

class App extends Component {
  state = {
    isAuthenticated: false,
    isAuthenticating: true,
    user: null,
    userSettings: null,
    userRec: null,
    userIng: null,
    userData: null,
    defaultIng: null
    
  }
  
  setAuthStatus = authenticated => {
    this.setState({ isAuthenticated: authenticated});
  }
  
  setUser = user => {
    this.setState({ user: user });
  }
  
  setUserSettings = userSettings => {
    this.setState({ userSettings: userSettings });
  }
  
  setDefaultIng = defaultIng => {
    this.setState({ defaultIng: defaultIng });
  }
  
  subscribeRecipe = async ( userId, recId, recName) => {
    try {
      const params = {
        "userId": userId,
        "recId": recId,
        "recName": recName
      };
      const res = await axios.patch(`${config.api.invokeUrl}/subscribe`, params);
      let data = res.Attributes;
      
      this.setState([...this.state.userRec, data]);
      console.log(this.userRec);
      console.log("subscribed");
    }catch (err) {
      console.log(`Error subscribing to recipe: ${err}`);
    }
    
  }
  
  async componentDidMount() {
    try {
      const session = await Auth.currentSession();
      this.setAuthStatus(true);
      console.log(session);
      const user = await Auth.currentAuthenticatedUser();
      this.setUser(user);
      if (this.state.isAuthenticated) {
        try {
          const userId = this.state.user.attributes.sub;
          let userRec = [];
          let userIng = [];
          let userData = [];
          const params = {
            "userId": userId,
            "sett": true
          }; 
          
          let res1 = await axios.patch(`${config.api.invokeUrl}/user/configsettings`, params);
          let res2 = await axios.post(`${config.api.invokeUrl}/recipes/${userId}`, params);
          let res3 = await axios.get(`${config.api.invokeUrl}/ingredients`);
          res3.data.sort((a, b) => (a.iName > b.iName) ? 1 : -1);
          this.setUserSettings(res1.data.Attributes);
          this.setDefaultIng(res3.data);
          let arr1 = res2.data; 
          arr1.forEach( item => {
            if (item.sk.startsWith("USER-")) {
              userData.push(item);
            } else if (item.sk.startsWith("REC-")) {
              userRec.push(item);
            } else if (item.sk.startsWith("ING-")) {
              userIng.push(item);
            }
          });
          this.setState({ userData: userData });
          this.setState({ userIng: userIng });
          this.setState({ userRec: userRec });
          this.setState({ defaultIng: res3.data });
        }catch (err) {
          console.log(`An error has occurred while initializing user: ${err}`);
        }

      }
    } catch (error) {
      console.log(error);
    }
    this.setState({ isAuthenticating: false });
  }
  
  render() {
    const authProps = {
      isAuthenticated: this.state.isAuthenticated,
      user: this.state.user,
      setAuthStatus: this.setAuthStatus,
      setUser: this.setUser
    }
    const appState = {
      userSettings: this.state.userSettings,
      setUserSettings: this.setUserSettings,
      userRec: this.state.userRec,
      setUserRec: this.setUserRec,
      defaultIng: this.state.defaultIng,
      setDefaultIng: this.setDefaultIng, 
      userIng: this.state.userIng,
      subscribeRecipe: this.subscribeRecipe
    }
    return (
      !this.state.isAuthenticating && 
      <div className="App">
        <Router>
          <div className="container">
            <MainNavbar auth={authProps} appState={appState} />
            <Switch>
              <Route exact path="/" render={(props) => <Home {...props} auth={authProps} />} />
              <Route exact path="/login" render={(props) => <LogIn {...props} auth={authProps} appState={appState} />} />
              <Route exact path="/register" render={(props) => <Register {...props} auth={authProps} appState={appState} />} />
              <Route exact path="/forgotpassword" render={(props) => <ForgotPassword {...props} auth={authProps} appState={appState} />} />
              <Route exact path="/forgotpasswordverification" render={(props) => <ForgotPasswordVerification {...props} auth={authProps} appState={appState} />} />
              <Route exact path="/changepassword" render={(props) => <ChangePassword {...props} auth={authProps} appState={appState} />} />
              <Route exact path="/changepasswordconfirmation" render={(props) => <ChangePasswordConfirm {...props} auth={authProps} appState={appState} />} />
              <Route exact path="/welcome" render={(props) => <Welcome {...props} auth={authProps} />} />
              <Route exact path="/ingredients" render={(props) => <Ingredients {...props} auth={authProps} appState={appState} />} />
              <Route exact path="/recipes" render={(props) => <Recipes {...props} auth={authProps} appState={appState} />} />
            </Switch>
            <Footer />
          </div>
        </Router>
      </div>
    );
  }
};

export default App;
