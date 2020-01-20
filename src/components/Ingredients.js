import React, { useState, useEffect } from 'react';
//import { Link } from "react-router-dom";
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Button, ButtonGroup,
  Container,
  Input,
  Table
} from "reactstrap";

const config = require('../config.json');

export default function Ingredients(props) {
  const [state, setState] = useState({
    ingredients: [],
    editingIndex: ""
  });
  const [ingredients, setIngredients] = useState([]);
  const [editingIndex, setEditingIndex] = useState("");  //When the edit button for an ingredient is clicked, that ingredients[editingIndex].editing is toggled to true
  
  useEffect(() => {
    fetchIngredients();
  },[setState]);

  const fetchIngredients = async () => {
    // add call to AWS API Gateway to fetch products here
    // then set them in state
    try {
      let newState = state;
      newState.ingredients = [];
      const res = await axios.get(`${config.api.invokeUrl}/ingredients`); //Note that db query uses projection expressions and not all values from the record are returned.  
      let dataArr = res.data;
      let addData = {
        'editing': false,
      };
      dataArr.sort((a, b) => (a.iName > b.iName) ? 1 : -1);
      dataArr.forEach( (obj, index) => {
        newState.ingredients.push(Object.assign(obj, addData));
      });
      //prepend a copy of the first item in newArr and set default values.
      let defaultIng = {
        sk: "new",
        iName: "",
        cat: "select",
        sett:{"res":"0"}
      }
      newState.ingredients.unshift(defaultIng);
      setState(Object.assign({},state,newState));
      console.log(newState);
    } catch (err) {
      console.log(`An error has occurred: ${err}`);
    }
  }

  function handleResChange(e) {
    e.preventDefault();
    let newState = state;
    let i = state.editingIndex;
    newState.ingredients[i].sett.res = e.target.value;
    setState(Object.assign({},state,newState));  
  }
  
  function handleNameChange(e) {
    let newArr = [...ingredients];
    newArr[editingIndex].iName = e.target.value;
    setIngredients(newArr);
  }
  function handleTypeChange(e) {
    let newArr = [...ingredients];
    console.log(e.target.options[e.target.selectedIndex].value);
    newArr[editingIndex].cat = e.target.value;
    setIngredients(newArr);
  }
 
  const saveIng = async (e) => {
    e.preventDefault();
    let i = state.editingIndex;
    let newState = state;
    try {
      const params = {
        "sk": state.ingredients[i].sk,
        "iName": state.ingredients[i].iName, 
        "cat": state.ingredients[i].cat,
        "sett": state.ingredients[i].sett
      };
      console.log(params);
      await axios.patch(`${config.api.invokeUrl}/ingredients`, params);
      fetchIngredients();
    }catch (err) {
      console.log(`An error has occurred while saving ingredient data: ${err}`);
    }
    newState.editingIndex = "";
    setState(Object.assign({},state,newState));
  }
  
  function editIng(e) {
    e.preventDefault();
    let i = e.target.getAttribute('data-index');
    let newState = state;
    newState.editingIndex = i;
    newState.ingredients[i].editing = true;
    setState(Object.assign({},state,newState));
  }
  
//  function btnClick(e) {
//    console.log(`Button clicked: ${e.target.getAttribute('data-index')}`);
//  }
  
  function cancelEdit(e) {
    e.preventDefault();
    let newState = state;
    let i = state.editingIndex;
    newState.ingredients[i].editing = false;
    newState.editingIndex = "";
    setState(Object.assign({},state,newState));
  }
  
  /** If i replace the buttons below with this code, the function fired gets null values from event.target.   WTF?
  <ButtonGroup>
  <Button 
    type="button" 
    color="link"
    data-index={index} 
    onClick={saveIng}
    >
    <FontAwesomeIcon data-index={index} icon="save" size="2x"/>
  </Button>
  <Button 
    type="button" 
    color="link"
    data-index={index} 
    onClick={cancelEdit}
    >
    <FontAwesomeIcon data-index={index} icon="window-close" size="2x"/>
  </Button>
</ButtonGroup>


<Button 
  type="button" 
  color="link"
  data-index={index} 
  disabled={editingIndex != "" && index != editingIndex ? ("disabled") : ("")} 
  onClick={editIng}
  >
  <FontAwesomeIcon data-index={index} icon="pen-square" size="2x"/>
</Button> */

  return (
    <Container>
      <h3>Ingredients</h3>
      
      <Table size="sm">
        <thead>
          <tr className="container">
            <th>NAME</th>
            <th>TYPE</th>
            <th>WGT RESOLUTION</th>
            <th className="col-1"></th>
          </tr>
        </thead>
        <tbody>
          {state.ingredients.map( (obj, index) => {
            return(
              <tr key={index} className={obj.editing ? ("table-active") : ("")}>
                <td>
                  <Input 
                    type='text'
                    value={obj.iName}
                    disabled ={obj.editing ? ("") : ("disabled")}
                    className={obj.editing ? ("form-control") : ("form-control-plaintext")}
                    onChange={handleNameChange}
                    placeholder="* click edit *"
                  />
                </td>
                <td>
                  <Input 
                    type="select" 
                    className={obj.editing ? ("form-control") : ("form-control-plaintext")}
                    value={obj.cat} 
                    disabled={obj.editing ? ("") : (true)}                
                    onChange={handleTypeChange}  
                  >  
                    <option value="select" disabled>select</option>
                    <option value="blend">blend</option>
                    <option value="garnish">garnish</option>                
                    <option value="liquid">liquid</option>
                    <option value="spice">spice</option>                
                  </Input>
                </td>
                <td>
                  <Input
                    className={obj.editing ? ("form-control") : ("form-control-plaintext")}
                    disabled={obj.editing ? ("") : (true)}
                    min="0"
                    max="3"
                    onChange={handleResChange}
                    type="number"
                    value={obj.sett.res} 
                  />  
                </td>
                <td>
                  {obj.editing ? (
                    <div>
                      
                      <input data-index={index} type="button" value="save" onClick={saveIng}/>
                      <input data-index={index} type="button" value="x"  onClick={cancelEdit}/>
                     </div>
                  ) : (
                    <div>
                       
                      <input data-index={index} type="button" value="edit"  onClick={editIng}/>
                    </div>
                  )}  
                </td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </Container>
  )
}