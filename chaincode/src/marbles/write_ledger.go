/*
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

// ============================================================================================================================
// write() - genric write variable into ledger
// 
// Shows Off PutState() - writting a key/value into the ledger
//
// Inputs - Array of strings
//    0   ,    1
//   key  ,  value
//  "abc" , "test"
// ============================================================================================================================
func write(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var key, value string
	var err error
	fmt.Println("starting write")

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2. key of the variable and value to set")
	}

	// input sanitation
	err = sanitize_arguments(args)
	if err != nil {
		return shim.Error(err.Error())
	}

	key = args[0]                                   //rename for funsies
	value = args[1]
	err = stub.PutState(key, []byte(value))         //write the variable into the ledger
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("- end write")
	return shim.Success(nil)
}

// ============================================================================================================================
// delete_marble() - remove a marble from state and from marble index
// 
// Shows Off DelState() - "removing"" a key/value from the ledger
//
// Inputs - Array of strings
//      0      ,         1
//     id      ,  authed_by_company
// "m999999999", "united marbles"
// ============================================================================================================================
func delete_marble(stub shim.ChaincodeStubInterface, args []string) (pb.Response) {
	fmt.Println("starting delete_marble")

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	// input sanitation
	err := sanitize_arguments(args)
	if err != nil {
		return shim.Error(err.Error())
	}

	id := args[0]
	authed_by_company := args[1]

	// get the marble
	marble, err := get_marble(stub, id)
	if err != nil{
		fmt.Println("Failed to find marble by id " + id)
		return shim.Error(err.Error())
	}

	// check authorizing company (see note in set_owner() about how this is quirky)
	if marble.Owner.Company != authed_by_company{
		return shim.Error("The company '" + authed_by_company + "' cannot authorize deletion for '" + marble.Owner.Company + "'.")
	}

	// remove the marble
	err = stub.DelState(id)                                                 //remove the key from chaincode state
	if err != nil {
		return shim.Error("Failed to delete state")
	}

	fmt.Println("- end delete_marble")
	return shim.Success(nil)
}
// ============================================================================================================================
// Init Marble - create a new marble, store into chaincode state
//
// Shows off building a key's JSON value manually
//
// Inputs - Array of strings
//      0      ,    1  ,  2  ,      3          ,       4
//     id      ,  color, size,     owner id    ,  authing company
// "m999999999", "blue", "35", "o9999999999999", "united marbles"
// ============================================================================================================================
func init_marble(stub shim.ChaincodeStubInterface, args []string) (pb.Response) {
	var err error
	fmt.Println("starting init_marble")

	if len(args) != 5 {
		return shim.Error("Incorrect number of arguments. Expecting 5")
	}

	//input sanitation
	err = sanitize_arguments(args)
	if err != nil {
		return shim.Error(err.Error())
	}

	id := args[0]
	color := strings.ToLower(args[1])
	owner_id := args[3]
	authed_by_company := args[4]
	size, err := strconv.Atoi(args[2])
	if err != nil {
		return shim.Error("3rd argument must be a numeric string")
	}

	//check if new owner exists
	owner, err := get_owner(stub, owner_id)
	if err != nil {
		fmt.Println("Failed to find owner - " + owner_id)
		return shim.Error(err.Error())
	}

	//check authorizing company (see note in set_owner() about how this is quirky)
	if owner.Company != authed_by_company{
		return shim.Error("The company '" + authed_by_company + "' cannot authorize creation for '" + owner.Company + "'.")
	}

	//check if marble id already exists
	marble, err := get_marble(stub, id)
	if err == nil {
		fmt.Println("This marble already exists - " + id)
		fmt.Println(marble)
		return shim.Error("This marble already exists - " + id)  //all stop a marble by this id exists
	}

	//build the marble json string manually
	str := `{
		"docType":"marble", 
		"id": "` + id + `", 
		"color": "` + color + `", 
		"size": ` + strconv.Itoa(size) + `, 
		"owner": {
			"id": "` + owner_id + `", 
			"username": "` + owner.Username + `", 
			"company": "` + owner.Company + `"
		}
	}`
	err = stub.PutState(id, []byte(str))                         //store marble with id as key

	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("- end init_marble")
	return shim.Success(nil)
}


// ============================================================================================================================
// Init Product - create a new product, store into chaincode state
//
// Shows off building a key's JSON value manually
//
// Inputs - Array of strings
// 0-1      0     ,       1 ,        2,		3		4	5		6		7		8		9		10
// productid,   groupid, groupname, registeruserid, registerusername,registerdate,productname, productweight ,productvolume 
//
//
//		9		10
//   mainingredientname, forcoin
// 

// ============================================================================================================================
func init_product(stub shim.ChaincodeStubInterface, args []string) (pb.Response) {
	var err error
	fmt.Println("starting init_product")


	if len(args) != 11 {
		return shim.Error("Incorrect number of arguments. Expecting 11")
	}


	//input sanitation
	err = sanitize_arguments(args)
	if err != nil {
		return shim.Error(err.Error())
	}
	var product Product

	product.ObjectType = "product"

	product.GroupId = args[0]
	product.GroupName = strings.ToLower(args[1])
	product.RegisterUserId = args[2]
	product.RegisterUserName = strings.ToLower(args[3])
	product.ProductId = args[4]
	product.RegisterDate = strings.ToLower(args[5])
	product.ProductName =strings.ToLower(args[6])
	product.ProductWeight = strings.ToLower(args[7])
	product.ProductVolume = strings.ToLower(args[8])
	product.MainIngredientName = strings.ToLower(args[9])
	product.FORCoin,err = strconv.Atoi(args[10])


	productAsBytes, _ :=json.Marshal(product)

	fmt.Println("writing product to state")

	fmt.Println(string(productAsBytes))
	fmt.Println("productid",product.ProductId)
	err = stub.PutState(product.ProductId, productAsBytes)                    //store owner by its Id
	if err != nil {
		fmt.Println("Could not store product")
		return shim.Error(err.Error())
	}

//	if err != nil {
//		return shim.Error("3rd argument must be a numeric string")
//	}


	//build the product json string manually
//	str := `{
//		"docType":"product",
//		"groupid": "` + groupid + `",
//		"groupname": "sarang",
//		"registeruserid": "sarng2",
//		"registerusername": "sarararng",
//		"productid": "` + productid + `",
//		"registerdate": "` + registerdate + `",
//		"productname": "` + productname + `",
//		"productweight": "` + productweight + `",
//		"productvolume": "` + productvolume + `",
//		"mainingredientname": "` + mainingredientname + `", 
//		"forcoin": ` + strconv.Itoa(forcoin) + `, 
//	}`
//	err = stub.PutState(productid, []byte(str))                         //store product with id as key
//
//	Avals ,err :=stub.GetState(productid)
//	AvalsString :=string(Avals)
//
//	fmt.Println("product?",AvalsString)
//
//
//	if err != nil {
//		return shim.Error(err.Error())
//	}
//
	fmt.Println("- end init_product")

	return shim.Success(nil)
}
// ============================================================================================================================
// Init Matrial  - create a new product, store into chaincode state
//
// Shows off building a key's JSON value manually
//
// Inputs - Array of strings
// 0-1      0     ,       1 ,        2,		3		4	5		6		7		8
//   materialid,  groupid, groupname, registeruserid, registerusername, materialname,registerdate, materialweight ,forcoin 
//
//
// 
// ============================================================================================================================
func init_material(stub shim.ChaincodeStubInterface, args []string) (pb.Response) {
	var err error
	fmt.Println("starting init_matrial")

	if len(args) != 9 {
		return shim.Error("Incorrect number of arguments. Expecting 9")
	}

	//input sanitation
	err = sanitize_arguments(args)
	if err != nil {
		return shim.Error(err.Error())
	}
	var material Material
	material.ObjectType = "material"
	material.GroupId = args[0]
	material.GroupName = strings.ToLower(args[1])
	material.RegisterUserId = strings.ToLower(args[2])

	material.RegisterUserName = strings.ToLower(args[3])
	material.MaterialId = args[4]

	material.MaterialName = strings.ToLower(args[5])
	material.RegisterDate =strings.ToLower(args[6])
	material.MaterialWeight = strings.ToLower(args[7])

	material.FORCoin,err = strconv.Atoi(args[8])

	materialAsBytes, _ :=json.Marshal(material)

	fmt.Println("writing material to state")
	
	fmt.Println(string(materialAsBytes))
	fmt.Println("materialid",material.MaterialId)
	

	err = stub.PutState(material.MaterialId, materialAsBytes)                    //store owner by its Id

	if err != nil {
		fmt.Println("Could not store material")
		return shim.Error(err.Error())
	}




//	if err != nil {
//		return shim.Error("3rd argument must be a numeric string")
//	}
//
//
//	//build the product json string manually
//	str := `{
//		"docType":"matrial",
//		"materialid": "` + materialid + `",
//		"groupid": "` + groupid + `",
//		"groupname": "` + groupname + `",
//		"registeruserid": "` + registeruserid + `",
//		"registerusername": "` + registerusername + `",
//		"materialname": "` + materialname + `",
//		"registerdate": "` + registerdate + `",
//		"materialweight": "` + materialweight + `",
//		"forcoin": ` + strconv.Itoa(forcoin) + `, 
//	}`
//	err = stub.PutState(materialid, []byte(str))                         //store material with id as key

//	if err != nil {
//		return shim.Error(err.Error())
//	}

	fmt.Println("- end init_material")
	return shim.Success(nil)
}

// ============================================================================================================================
// Init Contract  - create a new product, store into chaincode state
//
// Shows off building a key's JSON value manually
//
// Inputs - Array of strings
//     0     ,       1 ,		2,		3		4		5			6			
//    contractid,contractcount  supplygroupid, supplygroupname, developgroupid, developgroupname, registersupplyuserid,registerdevelopuserid, 
// 
//	7,			8				9			10		11		12	13		
//    registersupplyusername, registerdevelopusername, issupplygroupconfirm, isdevelopgroupconfirm ,materialid ,materialname ,materialweight
//	14, 15
//  forcoin
// ============================================================================================================================
func init_contract(stub shim.ChaincodeStubInterface, args []string) (pb.Response) {
	var err error
	fmt.Println("starting init_contract")

	if len(args) != 15 {
		return shim.Error("Incorrect number of arguments. Expecting 15")
	}

	//input sanitation
	err = sanitize_arguments(args)
	if err != nil {
		return shim.Error(err.Error())
	}
	var contract Contract
	contract.ObjectType = "contract"
	contract.ContractId = args[0]
	contract.SupplyGroupId = strings.ToLower(args[1])
	contract.SupplyGroupName = strings.ToLower(args[2])
	contract.DevelopGroupId = strings.ToLower(args[3])
	contract.DevelopGroupName = strings.ToLower(args[4])
	contract.RegisterSupplyUserId = strings.ToLower(args[5])
	contract.RegisterDevelopUserId = strings.ToLower(args[6])
	contract.RegisterSupplyUserName= strings.ToLower(args[7])
	contract.RegisterDevelopUserName = strings.ToLower(args[8])
	contract.IsSupplyGroupConfirm = strings.ToLower(args[9])
	contract.IsDevelopGroupConfirm= strings.ToLower(args[10])
	contract.MaterialId = args[11]
	contract.MaterialName = strings.ToLower(args[12])
	contract.MaterialWeight = strings.ToLower(args[13])
	contract.FORCoin,err = strconv.Atoi(args[14])

	materialAsBytes, _ :=json.Marshal(contract)

	fmt.Println("writing contract to state")

	fmt.Println(string(materialAsBytes))
	fmt.Println("contractid",contract.ContractId)
	

	err = stub.PutState(contract.ContractId, materialAsBytes)                    //store owner by its Id
	if err != nil {
		fmt.Println("Could not store contract")
		return shim.Error(err.Error())
	}


//	if err != nil {
//		return shim.Error("3rd argument must be a numeric string")
//	}


	//build the product json string manually
//	str := `{
//		"docType":"contract",
//		"contractid": "` + contractid + `",
//		"supplygroupid": "` + supplygroupid + `",
//		"supplygroupname": "` + supplygroupname + `",
//		"developgroupid": "` + developgroupid + `",
//		"developgroupname": "` + developgroupname + `",
//		"registersupplyuserid": "` + registersupplyuserid + `",
//		"registerdevelopuserid": "` + registerdevelopuserid + `",
//		"registersupplyusername": "` + registersupplyusername + `",
//		"registerdevelopusername": "` + registerdevelopusername + `",
//
//		"issupplygroupconfirm": "` + issupplygroupconfirm + `",
//		"isdevelopgroupconfirm": "` + isdevelopgroupconfirm + `",
//		"materialid": "` + materialid + `",
//		"materialname": "` + materialname + `",
//		"materialweight": "` + materialweight + `",
//		"forcoin": ` + strconv.Itoa(forcoin) + `, 
//	}`
//	err = stub.PutState(contractid, []byte(str))                         //store contract with id as key
//	if err != nil {
//		return shim.Error(err.Error())
//	}

	fmt.Println("- end init_contract")
	return shim.Success(nil)
}
// ============================================================================================================================
// Init Owner - create a new owner aka end user, store into chaincode state
//
// Shows off building key's value from GoLang Structure
//
// Inputs - Array of Strings
//           0     ,     1   ,   2
//      owner id   , username, company
// "o9999999999999",     bob", "united marbles"
// ============================================================================================================================
func init_owner(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var err error
	fmt.Println("starting init_owner")

	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments. Expecting 3")
	}

	//input sanitation
	err = sanitize_arguments(args)
	if err != nil {
		return shim.Error(err.Error())
	}

	var owner Owner
	owner.ObjectType = "marble_owner"
	owner.Id =  args[0]
	owner.Username = strings.ToLower(args[1])
	owner.Company = args[2]
	owner.Enabled = true
	fmt.Println(owner)

	//check if user already exists
	_, err = get_owner(stub, owner.Id)
	if err == nil {
		fmt.Println("This owner already exists - " + owner.Id)
		return shim.Error("This owner already exists - " + owner.Id)
	}

	//store user
	ownerAsBytes, _ := json.Marshal(owner)                         //convert to array of bytes
	err = stub.PutState(owner.Id, ownerAsBytes)                    //store owner by its Id
	if err != nil {
		fmt.Println("Could not store user")
		return shim.Error(err.Error())
	}

	fmt.Println("- end init_owner marble")
	return shim.Success(nil)
}

// ============================================================================================================================
// Set Owner on Marble
//
// Shows off GetState() and PutState()
//
// Inputs - Array of Strings
//       0     ,        1      ,        2
//  marble id  ,  to owner id  , company that auth the transfer
// "m999999999", "o99999999999", united_mables" 
// ============================================================================================================================
func set_owner(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var err error
	fmt.Println("starting set_owner")

	// this is quirky
	// todo - get the "company that authed the transfer" from the certificate instead of an argument
	// should be possible since we can now add attributes to the enrollment cert
	// as is.. this is a bit broken (security wise), but it's much much easier to demo! holding off for demos sake

	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments. Expecting 3")
	}

	// input sanitation
	err = sanitize_arguments(args)
	if err != nil {
		return shim.Error(err.Error())
	}

	var marble_id = args[0]
	var new_owner_id = args[1]
	var authed_by_company = args[2]
	fmt.Println(marble_id + "->" + new_owner_id + " - |" + authed_by_company)

	// check if user already exists
	owner, err := get_owner(stub, new_owner_id)
	if err != nil {
		return shim.Error("This owner does not exist - " + new_owner_id)
	}

	// get marble's current state
	marbleAsBytes, err := stub.GetState(marble_id)
	if err != nil {
		return shim.Error("Failed to get marble")
	}
	res := Marble{}
	json.Unmarshal(marbleAsBytes, &res)           //un stringify it aka JSON.parse()

	// check authorizing company
	if res.Owner.Company != authed_by_company{
		return shim.Error("The company '" + authed_by_company + "' cannot authorize transfers for '" + res.Owner.Company + "'.")
	}

	// transfer the marble
	res.Owner.Id = new_owner_id                   //change the owner
	res.Owner.Username = owner.Username
	res.Owner.Company = owner.Company
	jsonAsBytes, _ := json.Marshal(res)           //convert to array of bytes
	err = stub.PutState(args[0], jsonAsBytes)     //rewrite the marble with id as key
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("- end set owner")
	return shim.Success(nil)
}

// ============================================================================================================================
// Disable Marble Owner
//
// Shows off PutState()
//
// Inputs - Array of Strings
//       0     ,        1      
//  owner id       , company that auth the transfer
// "o9999999999999", "united_mables"
// ============================================================================================================================
func disable_owner(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var err error
	fmt.Println("starting disable_owner")

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	// input sanitation
	err = sanitize_arguments(args)
	if err != nil {
		return shim.Error(err.Error())
	}

	var owner_id = args[0]
	var authed_by_company = args[1]

	// get the marble owner data
	owner, err := get_owner(stub, owner_id)
	if err != nil {
		return shim.Error("This owner does not exist - " + owner_id)
	}

	// check authorizing company
	if owner.Company != authed_by_company {
		return shim.Error("The company '" + authed_by_company + "' cannot change another companies marble owner")
	}

	// disable the owner
	owner.Enabled = false
	jsonAsBytes, _ := json.Marshal(owner)         //convert to array of bytes
	err = stub.PutState(args[0], jsonAsBytes)     //rewrite the owner
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("- end disable_owner")
	return shim.Success(nil)
}
