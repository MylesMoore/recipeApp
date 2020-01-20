import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Button, ButtonGroup,
  Col, Container,
  Form, FormGroup, FormText,
  Input,
  Label,
  Modal, ModalHeader, ModalBody, ModalFooter,
  Nav, NavItem, NavLink,
  Row,
  Table
} from 'reactstrap';

const config = require('../config.json');

function Recipes(props) {
  let reload = false;
  const defaultRecState = {
    //The state for creating a new recipe
    activeRecInst: "",
    activeRecId: "",
    activeRecName: "",
    activeRecIng: [],
    activeRecNotes: "",
    activeRecRating: 0,
    activeRecIndex: "",
    activeRecAutorId: "",
    activeRecAuthorName: "",
    activeRecSaved: true,
    activeRecUserSettings: true,
    recSizeIndex: 1,
    addRecIng: "DEFAULT",
    qty: 1,
    permissions: {
      editRec: true
    },
    alerts: {
      recNameChange: false //True if the recipe author has changed the name of the recipe since user last viewed it.
    }
  };
  const [state, setState] = useState({
    userId: props.auth.user.attributes.sub,
    userIng: [...props.appState.userIng],
    userName: props.auth.user.username,
    recArr: props.appState.userRec,
    defaultIng:[...props.appState.defaultIng],
    recVolArr: [],
    ingWgtArr: [],
    recVolUOM: "",
    ingWgtUOM: "",
    activeRecInst: "",
    activeRecId: "",
    activeRecName: "",
    activeRecIng: [],
    activeRecNotes: "",
    activeRecRating: 0,
    activeRecIndex: "",
    activeRecAutorId: "",
    activeRecAuthorName: "",
    activeRecSaved: true,
    activeRecUserSettings: true,
    recSizeIndex: 1,
    addRecIng: "DEFAULT",
    qty: 1,
    permissions: {
      editRec: true
    },
    alerts: {
      recNameChange: false //True if the recipe author has changed the name of the recipe since user last viewed it.
    }
  });

  useEffect(() => {
    console.log("useEffect");
    initializeUserSettings();
  },[setState]);
  
  function initializeUserSettings() {
    let newState = Object.assign({}, state, defaultRecState);
    let userSett3 = props.appState.userSettings.sett.defSiz; //the user specified default sizes in ml
    //set recipe volume units and values
    let userSett1 = props.appState.userSettings.sett.units.recVol;
    if (userSett1 === "imp") {
      let newArr = userSett3.map( (item) => Math.round(item * 0.033814));
      newState.recVolUOM = "fl.oz.";
      newState.recVolArr = newArr;
    } else if (userSett1 === "met") {
      newState.recVolUOM = "ml";
      newState.recVolArr = userSett3;
    }
    
    //Set ingredient weight units and values
    let userSett2 = props.appState.userSettings.sett.units.ingWgt;
    if (userSett2 === "imp") {
      let newArr = userSett3.map( (item) => Math.round(item * 0.033814));
      newState.ingWgtUOM = "fl.oz.";
      newState.ingWgtArr = newArr;
    } else if (userSett2 === "met") {
      newState.ingWgtUOM = "ml";
      newState.ingWgtArr = userSett3;
    }
    setState(Object.assign({},newState));
  }

  function setDefaultRecState() {
    let newState = Object.assign({}, state, defaultRecState);
    newState.activeRecIng = joinIngs(newState.defaultIng, newState.userIng, []);
    setState(Object.assign({}, newState));
  }
  
  function unsubscribe() {
    console.log("unsubscribe");
  }
  
  function onChangeTextInput(e) {
    let newState = state;
    newState[e.target.id] = e.target.value;
    newState.activeRecSaved = false;
    setState(Object.assign({},state,newState));
  }
  
  const handleSizeChange = (e) => {
    let newState = state;
    newState.activeRecSaved = false;
    newState.recSizeIndex = e.target.getAttribute('data-key');
    setState(Object.assign({},state,newState));
  }

  function handleQtyChange(e) {
    let newState = state;
    newState.activeRecSaved = false;
    newState.qty = e.target.value;
    setState(Object.assign({},state,newState));
  }

  const handleUpdateRecipe = async () => {
    console.log("begin update");
    let arr1 = [...state.activeRecIng];
    let arr2 = []; //An abbreviated recipe ingredient array.
    let newRec = state.activeRecId.length === 0; 
    //Build the recipe ingredient object to send to the database
    arr1.forEach( (obj, i) => {
      let obj1 = {
        "sk": obj.sk,
        "coeff": obj.coeff,
        "coeffLocked": obj.coeffLocked,
        "ingUsed": obj.ingUsed
      };
      arr2.push(obj1);
    });    
    
    try {
      const params = {
        "userId": state.userId,
        "userName": state.userName,
        "recId": state.activeRecId.length > 0 ? (state.activeRecId) : (null),
        "recName": state.activeRecName.length > 0 ? (state.activeRecName) : (null),
        "recIng": arr2,  
        "recDesc": state.activeRecNotes.length > 0 ? (state.activeRecNotes) : (null),
        "recInst": state.activeRecInst.length > 0 ? (state.activeRecInst) : (null)
      };
      const res = await axios.patch(`${config.api.invokeUrl}/recipes`, params);
      console.log(res.data);
      let data = res.data.Attributes;
      let newState = state;
      newState.activeRecSaved = true;
      newState.activeRecId = data.sk;
      newState.activeRecName = data.iName
            
      // subscribe user to drink if they are the creator
      if (newRec) {
        props.appState.subscribeRecipe( state.userId, data.sk, data.iName );
      }
    }catch (err) {
      console.log(`Error updating recipe: ${err}`);
    }
  }
  
  function deleteIng(e) {
    e.preventDefault();
    /* This case needs to:
    *  1) toggle the ingUsed and coeffLocked properties of the adjusted ingredient to false.
    *  2) if all other ingredients are locked, instruct user to unlock one ingredient.
    *  3) set the coeff of the deleted ingrdient to zero.
    *  3) set step equal to the coefficient of the ingredient being deleted.
    *     The sign of this value will be reversed to produce the desired
    *     result during acion 4.
    *  4) If there is only one ingredient left, set the coeffLocked property
    *     to false and coeff to 1.
    *  5)    
    *  6) call distribute().
    */
    const i = e.target.getAttribute('data-key'); //the index of the ingredient being edited
    let newState = state;
    let ingArr = [...newState.activeRecIng];
    let unlockedCoeff = false;
    ingArr.forEach( (item, x) => {
      if (item.sk !== ingArr[i].sk && item.coeffLocked === false && item.ingUsed === true) {
        unlockedCoeff = true;
      };
    });
    
    if (unlockedCoeff === true) {
      ingArr[i].ingUsed = false;
      ingArr[i].coeffLocked = false;
      let adjustedIngNewCoeff = 0;
      let step = -ingArr[i].coeff;
      if (countUsedIng(ingArr) === 1) { //if there is only one ingredient, loop through ingArr and set all ingredients with ingUsed = true to coeffLocked = false.  We will only be changing one ingredient.
        ingArr.forEach( (obj, index) => {
         if (obj.ingUsed === true) {
           ingArr[index].coeffLocked = false;
         }
        });
      };
      newState.activeRecIng = distributeCoeff(ingArr, i, adjustedIngNewCoeff, step);
      console.log(newState.activeRecIng);
      setState(Object.assign({},state,newState));
    } else  {
      alert("one ingredient must be unlocked before you can delete this ingredient.");
    };
  }

  function deleteRecipe(recId) {
//    var r = window.confirm("Delete this recipe?");
//    const data = {
//      recipeId: recId,
//      userId: userId
//    };
//    if (r) {
//      axios.post('http://localhost:4000/recipes/delete/', data)
//        .then( res => console.log(res.data))
//        .then(setReload(true));
//    }
  }

  const getRecipe = async (e) => {
    e.preventDefault();
    let i = e.target.getAttribute('data-key');
    let newArr = [...state.recArr];
    const recId = newArr[i].sk;
    
    try {
      const params = {
        "recId": recId
      };
      const res = await axios.get(`${config.api.invokeUrl}/recipe/${recId}`, params);
      const data = res.data;
      let newState = state;
      newState.activeRecId = data.sk;
      newState.activeRecName = data.iName;
      newState.activeRecIndex = i;
      newState.activeRecAutorId = data.authId;
      newState.activeRecAuthorName = data.authName;
      newState.activeRecNotes = data.text1 === null ? ("") : (data.text1);
      newState.activeRecInst = data.text2 === null ? ("") : (data.text2);
      newState.activeRecIng = joinIngs(state.defaultIng, state.userIng, data.ing);
      newState.permissions.editRec = data.authId === `USER-${state.userId}`;
      newState.recArr.forEach( (item, i) => {
        if (item.sk === newState.activeRecId) {
          if (item.iName !== newState.activeRecName) {
            newState.alerts.recNameChange = true;
          } else {
            newState.alerts.recNameChange = false;
          }
        }
      });
      
      setState(Object.assign({},state,newState));
      console.log("Switching to recipe");
      console.log(newState);
    }catch (err) {
      console.log(`An error has occurred while fetching recipe data: ${err}`);
    }
  };
  
  function updateUserRecSettings() {
    console.log("update user rec settings");
    let newState = state;
    newState.alerts.recNameChange = false;
    setState(Object.assign({},state,newState));
  };

  function toggleCoeffLock(e) {
    let newState = state;
    let ingArr = [...state.activeRecIng];
    const i = e.target.getAttribute('data-key');
    ingArr[i].coeffLocked = !ingArr[i].coeffLocked;
    newState.activeRecIng = ingArr;
    setState(Object.assign({},state,newState));
  }

  function addIng(e){
    e.preventDefault();
    let newState = state;
    const i = e.target.options.selectedIndex;
    let newArr = [...state.activeRecIng];
    let ingIndex = e.target.options[i].getAttribute('data-key');
    newArr[ingIndex].ingUsed = !newArr[ingIndex].ingUsed;
    if (getCoeffSumAllIng(newArr) === 0) {
      newArr[ingIndex].coeff = 1;
    } else {
      newArr[ingIndex].coeff = 0;
    }
    newState.activeRecIng = newArr;
    setState(Object.assign({},state,newState));
  }



  function adjustIng(e) {
    /* DESCRIPTION
     * When an ingredient coefficient is adjusted by X, X needs to be proportionally
     * distributed to the remaining ingredients in the recipe.  Proportional
     * calcualations will be made using each ingredient's coefficient.  This will
     * be achieved by looping through the ingredients.  If the ingId property is equal
     * to the ingredient adjusted by the user, the coefficient will be adjusted
     * accordingly.  If the ingId property is not equal, the coefficient will be
     * adjusted.  After the calculations, there will be some rounding error.
     * To keep rounding errors in check, sum all ingredient coefficients in ingArr,
     * compare it to 1, and adjust the ingredient with the largest coefficient to
     * bri
     *
     * ADJUSTMENT CASE DESCRIPTIONS
     * CASE 0 will be the default case.  For this case, the default value for
     * step produces no unusual behavior.
     *
     * CASE 1 will be used when the step will cause a coefficient to be less
     * than zero.  For this instance, a new step will be calculated and the
     * coeff for the adjusted ingredient will be set to zero.  Rather than
     * calculating a new coeff with the new step, the coeff is set to zero to
     * avoid any rounding error that could occur with the calculation.  When
     * the standard step would cause a coeff to be less than 0, we know the
     * user wants to zero the ingredient.
     *
     * CASE 2 will be used when the step will cause a coefficient to be greater than 1.
     * For this instance, a new step will be calculated and the coeff for the
     * adjusted ingredient will be set to 1.  Because the user is setting the
     * coefficient to the max value of 1, it is assumed they want all effected
     * ingredients to go to zero.  This case will set the adjusted ingredient
     * coefficient to 1 and the effected ingredient coefficients to 0.
     *
     * CASE 3 will be used when sum of coefficients of effected ingredients
     * is equal to zero.  In such a case, distributing the step across effected
     * ingredients would result in dividing my zero.  This case needs to be handled
     * by alerting the user that two or more ingredient must be unlocked and
     * greater than zero to make this adjustment.
     *
     * CASE 4 will be used when sum of coefficients of effected ingredients
     * is equal to zero and the step will cause the adjusted coefficient to be
     * greater than 1.  In this case, the user would be hitting the + button on
     * an ingredient with coeff = 1, perhaps by accident.  METHOD 4 will have no action.
     *
     * CASE 5 will be used when a user tries to edit a locked ingredient.  Show an alert.
     *
     * CASE 6 will be used when there is one ingredient (sum of coefficients of effected ingredient = 0) and the user tries to adjust coeff.
    */

   //DEFINE VARIABLES
    let newState = state;
    let ingIndex = e.target.getAttribute('data-key');
    let step = Number(e.target.getAttribute('data-step'));
    let ingArr = [...state.activeRecIng];
    let adjustedIngNewCoeff = null; //the new coefficient of the adjusted ingredient.  Value is based on the ADJUSTMENT CASE
    let sumEffectCoeff = getCoeffSumEffectedIng(ingArr, ingIndex); //Determine the summation of all effected coefficients.  This value will be used in selecting an ADJUSTMENT METHOD.
    let adjustCase;
    //test conditions to determine ADJUSTMENT CASE
    if (ingArr[ingIndex].coeffLocked === true) {
      adjustCase = 5;
    } else if (ingArr[ingIndex].coeff + step < 0) {
      adjustCase = 1;
    } else if (sumEffectCoeff !== 0 && ingArr[ingIndex].coeff + step > 1) {
      adjustCase = 2;
    } else if (sumEffectCoeff === 0 && ingArr[ingIndex].coeff + step < 1) {
      adjustCase = 3;
    } else if (sumEffectCoeff === 0 && ingArr[ingIndex].coeff + step > 1) {
      adjustCase = 4;
    } else if (sumEffectCoeff === 0) {
      adjustCase = 6;
    } else {
      adjustCase = 0;
    }

    //Make adjustments according to ADJUSTMENT CASE
    switch (adjustCase) {
      case 0:
        /* This case will perform the following actions:
         *  1) set adjustedIngNewCoeff to the coefficient of the adjusted ingredient plus step.
         *  2) call distributeCoeff(), passing it the default value for step
         */
        console.log("case 0 - business as usual");
        adjustedIngNewCoeff = ingArr[ingIndex].coeff + step;
        ingArr = distributeCoeff(ingArr, ingIndex, adjustedIngNewCoeff, step);
        break;
      case 1:
        /* This case will perform the following actions:
         *  1) set adjustedIngNewCoeff to zero.
         *  2) set step to the value of the coefficient before the user made the change.
         *  3) call distributeCoeff()
         */
        console.log("case 1 - step causes coeff < 0");
        adjustedIngNewCoeff = 0;
        step = ingArr[ingIndex].coeff;
        ingArr = distributeCoeff(ingArr, ingIndex, adjustedIngNewCoeff, step);
        break;
      case 2:
        /* This case will perform the following actions:
         *  1) set coefficient of the adjusted ingredient to 1.
         *  2) set coefficient of each effected ingredient to 0.
         */
        console.log("case 2 - set adjusted ingredient to 1 and effected ingredients to 0");
        ingArr.forEach( (obj, index) => {
          if (index == ingIndex) {
            ingArr[index].coeff = 1;
          } else if (index != ingIndex) {
            ingArr[index].coeff = 0;
          }
        });
        break;
      case 3:
        console.log("case 3 - no ingredients available to accept coefficient distribution");
        alert("To make adjustments, two or more ingredients must be greater than zero and unlocked.");
        break;
      case 4:
        console.log("case 4");
        break;
      case 5:
        console.log("case 5");
        alert("Ingredient is locked.");
        break;
      case 6:
        console.log("case 6");
        alert("There must be two or more ingredients to make adjustments.");
        break;
      default:
        console.log("case default");
    }
    newState.activeRecSaved = false;
    newState.activeRecIng = ingArr;
    setState(Object.assign({}, state, newState));
  }
  
  function ModalRecNameChange() {
    return (
      <Modal isOpen={state.alerts.recNameChange} toggle={state.alerts.recNameChange}>
        <ModalHeader toggle={state.alerts.recNameChange}>Modal title</ModalHeader>
        <ModalBody>
          The author of this recipe has changed the name from {}
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={updateUserRecSettings}>Do Something</Button>{' '}
        </ModalFooter>
      </Modal>
    )
  }

//  if (loading || !user) {
//    return (
//      <div>Loading...</div>
//    );
//  }
  
  return (
    <Container>
      <ModalRecNameChange />
      <Row>  
        <Col xs="3">
          <p>My Recipes</p>
          <Nav vertical>
            <NavItem>
              <NavLink href="#" onClick={setDefaultRecState}><em>* create new *</em></NavLink>
            </NavItem>
            {state.recArr.map((obj,index) => {
                return (
                  <NavItem key={index} >
                    <NavLink href="#" data-key={index} onClick={getRecipe}>{obj.iName}</NavLink>
                  </NavItem>
                )
              })
            }
          </Nav>
        </Col>
        <Col xs="auto">
          <Form>
            <FormGroup>
              <Label for="recipeName">Recipe Name</Label>
              <Input type="name" id='activeRecName' value={state.activeRecName} onChange={onChangeTextInput} placeholder="select a recipe or enter new name" disabled ={state.permissions.editRec === true ? ("") : ("disabled")} />
            </FormGroup>

            <FormGroup>
              <Label for="recipeNotes">Description</Label>
              <Input type="textarea" id="activeRecNotes" value={state.activeRecNotes} onChange={onChangeTextInput} placeholder="enter description" disabled ={state.permissions.editRec === true ? ("") : ("disabled")} />
              <FormText color="muted">
                This description will appear in search results when recipes are made public.
              </FormText>
            </FormGroup>

            <FormGroup>
              <Label for="recipeNotes">Instructions</Label>
              <Input type="textarea" id='activeRecInst' value={state.activeRecInst} onChange={onChangeTextInput} placeholder="type instructions here" disabled ={state.permissions.editRec === true ? ("") : ("disabled")} />
            </FormGroup>
            
            <FormGroup>
              <Label for="recipeNotes">Notes</Label>
              <Input type="textarea" id='activeRecInst' value={state.activeRecInst} onChange={onChangeTextInput} placeholder="type instructions here" />
              <FormText color="muted">
                These notes are only visible to you.
              </FormText>
            </FormGroup>
            <Row>
              <Col>
                <FormGroup tag="fieldset" >
                  <Label for="recipeSize">Recipe Size ({state.recVolUOM})</Label>
                  {state.recVolArr.map( (item, index) => {
                    return (
                      <FormGroup key={index} check>
                        <Label check>
                          <Input
                              type="radio"
                              name="size"
                              value={item}
                              data-key={index}
                              onChange={handleSizeChange}
                              checked={index == state.recSizeIndex}
                            />
                          {item}
                        </Label>
                      </FormGroup>
                    )
                  })}
                </FormGroup>
              </Col>
              <Col>
                <FormGroup>
                  <Label for="quantity">Qty</Label>
                  <Input type="number" name="quantity" value={state.qty} onChange={handleQtyChange} min="1" />
                </FormGroup>
              </Col>
            </Row>
            <FormGroup>
              <Table size="sm">
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>grams</th>
                    <th></th>
                    <th>%</th>
                    { state.permissions.editRec === true ? (<th>delete</th>) : (false) }
                    { state.permissions.editRec === true ? (<th>lock</th>) : (false) }
                  </tr>
                </thead>
                <tbody>
                  {state.activeRecIng.map((obj,index) => {
                      if (obj.ingUsed === true) {
                        return (
                          <tr key={index} data-key={index}>
                            <td>{obj.iName}</td>
                            <td>{(Number(state.ingWgtArr[state.recSizeIndex]) * state.qty * obj.coeff).toFixed(obj.sett.res)}</td>

                            <td>
                              <ButtonGroup size="sm">
                                <Button data-key={index} data-step={-0.005} onClick={adjustIng}>-</Button>
                                <Button data-key={index} data-step={0.005} onClick={adjustIng}>+</Button>
                              </ButtonGroup>
                            </td>
                            <td>{(obj.coeff * 100).toFixed(2)}</td>
                            { state.permissions.editRec === true ? (<td><button key={index} data-key={index} onClick={deleteIng}>&times;</button></td>) : (false) }
                            { state.permissions.editRec === true ? (<td><input type="checkbox" checked={obj.coeffLocked} key={index} data-key={index} onChange={toggleCoeffLock}></input></td>) : (false) }
                          </tr>
                        )
                      }
                    })
                  }
                </tbody>
              </Table>
              <FormText color="muted">
                Add ingredients by selecting from the dropdown below.
              </FormText>
            </FormGroup>

            <FormGroup>
              <Input type="select" value={state.addRecIng} onChange={addIng}>  //**************** may want to replace this with the react-select https://react-select.com/props
                <option value="DEFAULT" disabled>add ingredient</option>
                {state.activeRecIng.map((obj,index,array) => {
                    return (
                      <option key={index} data-key={index} disabled={obj.ingUsed}>{obj.iName}</option>
                    );
                  })
                }
              </Input>
            </FormGroup>

            <Button block color="secondary" onClick={handleUpdateRecipe} disabled={state.activeRecSaved}>save</Button>
            <Button block color="warning" onClick={unsubscribe} disabled ={state.activeRecId.length === 0 ? ("disabled") : ("")}>delete</Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}

/*                           DEFINITIONS
 * ADJUSTED INGREDIENT - The adjusted ingredient is the ingredient a user
 *  adjusts.  When an adjustment to an ingredient in a recipe is made, there is
 *  only one adjusted ingredient.  The remaining ingredients in a recipe are
 *  "effected ingredients".
 * EFFECTED INGREDIENT - the effected ingredients are all ingredients in a
 *  recipe that will be changed due to a user adjustment.  It's important to
 *  remember that if the coeffLocked property is set to true for any ingredient,
 *  that ingredient will not be an effected ingredient.
 * RECIPE - a recipe is a collection of ingredients.  Among other properties,
 *  ingredients have coefficients that must total to 1.
 */

//                            FUNCTIONS
//Gets the sum of coefficients for all ingredients in a recipe
const getCoeffSumAllIng = (arr) => {
  let sum = 0;
  arr.forEach( (obj) => {
    sum += obj.coeff;
  });
  return sum;
}
//Counts the number of ingredients in ingArr that have ingUsed === true.
const countUsedIng = (arr) => {
  let sum = 0;
  arr.forEach( (obj) => {
    if(obj.ingUsed === true) {
      sum ++;
    }
  });
  return sum;
}
//Gets the sum of coefficients for all effected ingredients in a recipe
const getCoeffSumEffectedIng = (arr, ingIndex) => {
  let sum = 0;
  arr.forEach( (obj, index) => {
    if (index != ingIndex && arr[index].coeffLocked === false) {
      sum += obj.coeff;
    }
  });
  return sum;
}
//
////Gets the coefficients of the adjusted ingredient in a recipe
//const getCoeffAdjustedIng = (arr, ingIndex) => {
//  return arr[ingIndex].coeff;
//}

/* Distributes the coefficient of an adjusted ingredient to the effected ingredients.
 * Takes the following arguments:
 *  arr - the array of ingredient objects
 *  ingIndex - the index of the adjusted ingredient in arr
 *  adjustedIngNewCoeff - the value the user wants to change the adjusted ingredient coefficient to.
 *  step - the value of the change in coefficient of the adjusted ingredient.
 * This function will perform the following actions:
 *  1) sets the coefficient of the adjusted ingredient to adjustedIngNewCoeff.
 *  2) proportionally distributes the step to the coefficient of each effected ingredient.
 *  3) adjusts the ingredient with the largest coefficient to absorb the rounding error.
 *  4) returns an array of updated ingredient objects.
 */
function distributeCoeff(arr, ingIndex, adjustedIngNewCoeff, step) {
  let sumEffectCoeff = getCoeffSumEffectedIng(arr, ingIndex); //Get the sum of coefficients for effected ingredients.
  arr.forEach( (obj, index) => {
    if (index == ingIndex) {
      //Action 1
      arr[index].coeff = adjustedIngNewCoeff;
    } else if (index != ingIndex && arr[index].coeffLocked === false) {
      //Action 2
      arr[index].coeff = arr[index].coeff + (arr[index].coeff / sumEffectCoeff * (-step));
    }
  });
  //Action 3
  let sumAllCoeff = getCoeffSumAllIng(arr); //Needs to be updated because the coefficients were changed.
  let coeffErr = 1 - sumAllCoeff; // Calculate the error in the sum of all ingredient coefficients.
  let highest = 0;
  let indexHi = 0;  //The index of the ingredient with highest coefficient.  The value initializes to 0 incase the first ingredient in the array is the highest.
  highest = arr.reduce(function(prev, current, index) { //find the index of the ingredient with the highest coefficient
    if (prev.coeff > current.coeff) {
      return prev;
    } else {
      indexHi = index;
      return current;
    }
  });
  //Adjust the largest coefficent to correct rounding errors.
  arr[indexHi].coeff += coeffErr;
  return arr;
}

const joinIngs = (defaultIng, userIng, recIng) => {
  //This function combines various ingredient objects into one and overwrites certain properties.
  //The default ingredients will contain the most recent ingredients list.
  //Add the user ingredients properties and active recipe properties to the default ingredients.
  //Add the properties that complete the recipe ingredient object.
  //This should prepare the activeRecIng for creating a new recipe when the page first loads or if an existing recipe is selected
  let arr1 = [...defaultIng];
  let arr2 = [...userIng];
  let arr3 = [...recIng];
  let addData = {
    //'editing': false,
    'ingUsed': false,
    'coeffLocked': false,
    'coeff': 0
  };
  arr1.forEach( (obj1, i1) => {
    Object.assign(arr1[i1], addData); 
    arr2.forEach( (obj2, i2) => {
      if (obj1.sk === obj2.sk) {
        Object.assign(arr1[i1], arr2[i2]);
      }
    });
    arr3.forEach( (obj3, i3) => {
      if (obj1.sk === obj3.sk) {
        Object.assign(arr1[i1], arr3[i3]);
      }
    });
  });
  return arr1;
} 

export default Recipes;
  