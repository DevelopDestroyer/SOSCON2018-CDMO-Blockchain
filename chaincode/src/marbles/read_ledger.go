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
//	"bytes"
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

// ============================================================================================================================
// Read - read a generic variable from ledger
//
// Shows Off GetState() - reading a key/value from the ledger
//
// Inputs - Array of strings
//  0
//  key
//  "abc"
// 
// Returns - string
// ============================================================================================================================
func read(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var key, jsonResp string
	var err error
	fmt.Println("starting read")

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting key of the var to query")
	}

	// input sanitation
	err = sanitize_arguments(args)
	if err != nil {
		return shim.Error(err.Error())
	}

	key = args[0]
	valAsbytes, err := stub.GetState(key)           //get the var from ledger
	if err != nil {
		jsonResp = "{\"Error\":\"Failed to get state for " + key + "\"}"
		return shim.Error(jsonResp)
	}

	fmt.Println("- end read")
	return shim.Success(valAsbytes)                  //send it onward
}
// ============================================================================================================================
// Get everything we need (product + material + contract)
//
// Inputs - none
//
// Returns:
// ============================================================================================================================
func read_product(stub shim.ChaincodeStubInterface) pb.Response {
	type Everything struct {
		Products   []Product   `json:"product"`
		Materials  []Material  `json:"materials"`
		Contracts  []Contract  `json:"contracts"`
	}
	var everything Everything

	// ---- Get All product ---- //
	resultsIterator, err := stub.GetStateByRange("p0", "pzzzzzzzzzzzzzzzzzzzz")
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()
	var i int
	i=0
	for resultsIterator.HasNext() {
		i=i+1
		fmt.Println("for in~~~")
		aKeyValue, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		queryKeyAsStr := aKeyValue.Key
		queryValAsBytes := aKeyValue.Value
		fmt.Println("on product id - ", queryKeyAsStr)
		fmt.Println("on product num - ", i)
		var product Product

		json.Unmarshal(queryValAsBytes, &product)                  //un stringify it aka JSON.parse()
		fmt.Println("write.....b",product)

		everything.Products = append(everything.Products, product)   //add this marble to the list
	}



	fmt.Println("product array - ", everything.Products)

	// ---- Get All Materials ---- //
	matrialsIterator, err := stub.GetStateByRange("t0", "tzzzzzzzzzzzzzzzzzzzz")
	if err != nil {
		return shim.Error(err.Error())
	}
	defer matrialsIterator.Close()
	var u int 
	u =0
	for matrialsIterator.HasNext() {
		u = u + 1
		aKeyValue, err := matrialsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		queryKeyAsStr := aKeyValue.Key
		queryValAsBytes := aKeyValue.Value
		fmt.Println("on matrial id - ", queryKeyAsStr)
		fmt.Println("on material value - ", queryValAsBytes)
		fmt.Println("on material num = ", u)
		var material Material
		json.Unmarshal(queryValAsBytes, &material)                   //un stringify it aka JSON.parse()
		fmt.Println("material,,,",material)
		everything.Materials = append(everything.Materials, material)   //add this marble to the list

	}
	fmt.Println("material array - ", everything.Materials)

	// ---- Get All contracts ---- //
	contractsIterator, err := stub.GetStateByRange("c0", "czzzzzzzzzzzzzzzzzzzz")
	if err != nil {
		return shim.Error(err.Error())
	}
	defer contractsIterator.Close()
	var c int
	for contractsIterator.HasNext() {
		aKeyValue, err := contractsIterator.Next()
		c = c + 1
		if err != nil {
			return shim.Error(err.Error())
		}
		queryKeyAsStr := aKeyValue.Key
		queryValAsBytes := aKeyValue.Value

		fmt.Println("on contract id - ", queryKeyAsStr)
		fmt.Println("on contract value = ", queryValAsBytes)
		fmt.Println("on contract num = ",c )

		var contract Contract
		
		json.Unmarshal(queryValAsBytes, &contract)                   //un stringify it aka JSON.parse()
		fmt.Println("contract...",contract)
		everything.Contracts = append(everything.Contracts, contract)  //add this marble to the list
	}
	fmt.Println("contract array - ", everything.Contracts)



	fmt.Println("result", everything)

	//change to array of bytes
	everythingAsBytes, _ := json.Marshal(everything)              //convert to array of bytes
	fmt.Println(everythingAsBytes)

	return shim.Success(everythingAsBytes)
}


// ============================================================================================================================
// Get everything we need (owners + marbles + companies)
//
// Inputs - none
//
// Returns:
// {
//	"owners": [{
//			"id": "o99999999",
//			"company": "United Marbles"
//			"username": "alice"
//	}],
//	"marbles": [{
//		"id": "m1490898165086",
//		"color": "white",
//		"docType" :"marble",
//		"owner": {
//			"company": "United Marbles"
//			"username": "alice"
//		},
//		"size" : 35
//	}]
// }
// ============================================================================================================================
func read_everything(stub shim.ChaincodeStubInterface) pb.Response {
	type Everything struct {
		Owners   []Owner   `json:"owners"`
		Marbles  []Marble  `json:"marbles"`
	}
	var everything Everything

	// ---- Get All Marbles ---- //
	resultsIterator, err := stub.GetStateByRange("m0", "m9999999999999999999")
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()
	
	for resultsIterator.HasNext() {
		aKeyValue, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		queryKeyAsStr := aKeyValue.Key
		queryValAsBytes := aKeyValue.Value
		fmt.Println("on marble id - ", queryKeyAsStr)
		var marble Marble
		json.Unmarshal(queryValAsBytes, &marble)                  //un stringify it aka JSON.parse()
		everything.Marbles = append(everything.Marbles, marble)   //add this marble to the list
	}
	fmt.Println("marble array - ", everything.Marbles)

	// ---- Get All Owners ---- //
	ownersIterator, err := stub.GetStateByRange("o0", "o9999999999999999999")
	if err != nil {
		return shim.Error(err.Error())
	}
	defer ownersIterator.Close()

	for ownersIterator.HasNext() {
		aKeyValue, err := ownersIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		queryKeyAsStr := aKeyValue.Key
		queryValAsBytes := aKeyValue.Value
		fmt.Println("on owner id - ", queryKeyAsStr)
		var owner Owner
		json.Unmarshal(queryValAsBytes, &owner)                   //un stringify it aka JSON.parse()

		if owner.Enabled {                                        //only return enabled owners
			everything.Owners = append(everything.Owners, owner)  //add this marble to the list
		}
	}
	fmt.Println("owner array - ", everything.Owners)

	//change to array of bytes
	everythingAsBytes, _ := json.Marshal(everything)              //convert to array of bytes
	fmt.Println(everythingAsBytes)
	return shim.Success(everythingAsBytes)
}

// Get history of asset_______only product
//
// Shows Off GetHistoryForKey() - reading complete history of a key/value
//
// Inputs - Array of strings
//  0
//  productid
//  "p01490985296352SjAyM"
// ============================================================================================================================
func getHistory_product(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	type AuditHistory_p struct {
		TxId    string   `json:"txId"`
		Value   Product  `json:"value"`
		}
	var history []AuditHistory_p
	var product Product

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	productId := args[0]
	fmt.Printf("- start getHistoryForMarble: %s\n", productId)

	// Get History
	resultsIterator, err := stub.GetHistoryForKey(productId)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	for resultsIterator.HasNext() {
		historyData, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}

		var tx AuditHistory_p
		tx.TxId = historyData.TxId                     //copy transaction id over
		json.Unmarshal(historyData.Value, &product)     //un stringify it aka JSON.parse()
		if historyData.Value == nil {                  //product has been deleted
			var emptyProduct Product
			tx.Value = emptyProduct                 //copy nil product
		} else {
			json.Unmarshal(historyData.Value, &product) //un stringify it aka JSON.parse()
			tx.Value = product                      //copy product over
		}
		history = append(history, tx)              //add this tx to the list
	}
	fmt.Printf("- getHistoryForProduct returning:\n%s", history)

	//change to array of bytes
	historyAsBytes, _ := json.Marshal(history)     //convert to array of bytes
	return shim.Success(historyAsBytes)
}


// ============================================================================================================================
// Get history of asset
//
// Shows Off GetHistoryForKey() - reading complete history of a key/value
//
// Inputs - Array of strings
//  0
//  id
//  "m01490985296352SjAyM"
//
// ============================================================================================================================
func getHistory(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	type AuditHistory struct {
		TxId    string   `json:"txId"`
		Value   Marble   `json:"value"`
	}
	var history []AuditHistory;
	var marble Marble

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	marbleId := args[0]
	fmt.Printf("- start getHistoryForMarble: %s\n", marbleId)

	// Get History
	resultsIterator, err := stub.GetHistoryForKey(marbleId)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	for resultsIterator.HasNext() {
		historyData, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}

		var tx AuditHistory
		tx.TxId = historyData.TxId                     //copy transaction id over
		json.Unmarshal(historyData.Value, &marble)     //un stringify it aka JSON.parse()
		if historyData.Value == nil {                  //marble has been deleted
			var emptyMarble Marble
			tx.Value = emptyMarble                 //copy nil marble
		} else {
			json.Unmarshal(historyData.Value, &marble) //un stringify it aka JSON.parse()
			tx.Value = marble                      //copy marble over
		}
		history = append(history, tx)              //add this tx to the list
	}
	fmt.Printf("- getHistoryForMarble returning:\n%s", history)

	//change to array of bytes
	historyAsBytes, _ := json.Marshal(history)     //convert to array of bytes
	return shim.Success(historyAsBytes)
}

// ============================================================================================================================
// Get history of asset - performs a range query based on the start and end keys provided.
//
// Shows Off GetStateByRange() - reading a multiple key/values from the ledger
//
// Inputs - Array of strings
//       0     ,    1
//   startKey  ,  endKey
//  "marbles1" , "marbles5"
// ============================================================================================================================
//func getMarblesByRange(stub shim.ChaincodeStubInterface, args []string) pb.Response {
//	if len(args) != 2 {
//		return shim.Error("Incorrect number of arguments. Expecting 2")
//	}
//
//	startKey := args[0]
//	endKey := args[1]
//
//	resultsIterator, err := stub.GetStateByRange(startKey, endKey)
//	if err != nil {
//		return shim.Error(err.Error())
//	}
//	defer resultsIterator.Close()
//
//	// buffer is a JSON array containing QueryResults
//	var buffer bytes.Buffer
//	buffer.WriteString("[")
//
//	bArrayMemberAlreadyWritten := false
//	for resultsIterator.HasNext() {
//		aKeyValue, err := resultsIterator.Next()
//		if err != nil {
//			return shim.Error(err.Error())
//		}
//		queryResultKey := aKeyValue.Key
//		queryResultValue := aKeyValue.Value
//
//		// Add a comma before array members, suppress it for the first array member
//		if bArrayMemberAlreadyWritten == true {
//			buffer.WriteString(",")
//		}
//		buffer.WriteString("{\"Key\":")
//		buffer.WriteString("\"")
//		buffer.WriteString(queryResultKey)
//		buffer.WriteString("\"")
//
//		buffer.WriteString(", \"Record\":")
//		// Record is a JSON object, so we write as-is
//		buffer.WriteString(string(queryResultValue))
//		buffer.WriteString("}")
//		bArrayMemberAlreadyWritten = true
//	}
//	buffer.WriteString("]")
//
//	fmt.Printf("- getMarblesByRange queryResult:\n%s\n", buffer.String())
//
//	return shim.Success(buffer.Bytes())
//}
