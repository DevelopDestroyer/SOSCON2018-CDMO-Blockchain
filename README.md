# FOR Team
We are 'f'ocus 'o'n the 'r'oot

# Member and Role
 - Boohyung Lee (이부형) : PM
 - Sueyeon Lee (이수연) : Planner
 - Tae-ho Lee (이태호) : Dapp Developer
 - Sarang Wi (위사랑) : Hyperledger Developer
 
# Dapp Structure

# 구조
## Dapp 클라이언트
 - views/panel_home.pug : 모든 Dapp 기능은 싱글페이지에서 수행됩니다. view에서는 HTML/JQuery를 통해 사용자로부터 CDMO-Blockchain을 수행하기 위한 오더 및 데이터를 입력 받습니다.
 - public/js/ui_building.js : 인터페이스를 초기화 및 재배치하는 작업을 수행합니다.
 - public/js/ui_events : 웹소켓에서 전송된 내용을 기반으로 인터페이스를 조작하여 블록체인 산출물/결과물을 반영해줍니다.
 - public/js/websocket.js : view에서 입력받은 내용은 이 부분에서 컨트롤 되고 있습니다. 사용자로부터 입력받은 오더와 데이터를 적합한 포맷으로 정형화하며, 이를 웹소켓을 통해 Node.js기반 서버로 전송합니다.
## Dapp 서버
 - utils/websocket_server_side.js : 클라이언트로 부터 전송된 데이터들을 수신하며 트랙잭션을 수행하기 위해 데이터를 적절히 가공하여 트랜잭션을 요청하는 모듈에게 데이터를 넘겨줍니다.
 - utils/marbles_cc_lib.js : 실질적인 트랜잭션 요청단 입니다. 이 모듈은 인스턴스화 되어있는 체인코드의 명세를 알고있으며, 서버사이드로부터 요청된 사항에 따라 적합한 함수를 블록체인 네트워크가 수행 할 수 있도록 합니다.
## Chaincode
#### Product struct
   ObjectType string         `json:"docType"` //field for couchdb
   GroupId      string        `json:"groupid"` 
   GroupName  string        `json:"groupname"`
   RegisterUserId string     `json:"registeruserid"`
   RegisterUserName string     `json:"registerusername"`
   ProductId  string         `json:"productid"`      //the fieldtags are needed to keep case from bouncing around
   RegisterDate string        `json:"registerdate"` // 등록일
   ProductName string        `json:"productname"` // 제품명
   ProductWeight int         `json:"productweight"` // 중량
   ProductVolume int         `json:"productvolume"` //용량
   MainIngredientName string `json:"mainingredientname"` //주성분명칭
   FORCoin int              `json:"forcoin"` 
#### Material struct 
   ObjectType string         `json:"docType"` //field for couchdb
   GroupId      string        `json:"groupid"` 
   GroupName  string        `json:"groupname"`
   RegisterUserId string     `json:"registeruserid"`
   RegisterUserName string     `json:"registerusername"`
   MaterialId  string        `json:"materialid"`      //the fieldtags are needed to keep case from bouncing around
   MaterialName string      `json:"materialname"`
   RegisterDate string        `json:"registerdate"` // 등록일
   MaterialWeight int         `json:"materialweight"` // 중량
   FORCoin        int        `json:"forcoin"`
#### Contract struct 
   ObjectType string           `json:"docType"` //field for couchdb
   ContractId      string        `json:"contractid"` 
   SupplyGroupId  string       `json:"supplygroupid"`
   SupplyGroupName  string        `json:"supplygroupname"`
   DevelopGroupId   string      `json:"developgroupid"`
   DevelopGroupName string     `json:"developgroupname"`
   RegisterSupplyUserId string     `json:"registersupplyuserid"`
   RegisterDevelopUserId string     `json:"registerdevelopuserid"`
   RegisterSupplyUserName string `json:"registersupplyusername"`
   RegisterDevelopUserName string `json:"registerdevelopusername"`
   IsSupplyGroupConfirm string   `json:"issupplygroupconfirm"`
   IsDevelopGroupConfirm string `json:"isdevelopgroupconfirm"`
   MaterialID string          `json:"materialid"`
   MaterialName string          `json:"materialname"`
   MaterialWeight   int          `json:"materialweight"`
   FORCoin int                `json:"forcoin"` 
# Demo
 - https://www.youtube.com/watch?v=_OSyx8i57fA
