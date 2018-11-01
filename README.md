# FOR Team
Gazzzzzzzzzzzzzzzza~~~~~~~~~~~~~~~~~~~~~~~~!!!!!!!!!!!!!!!

# Member and Role
 - Boohyung Lee (이부형) : PM
 - Sueyeon Lee (이수연) : Planner
 - Tae-ho Lee (이태호) : Dapp Developer
 - Sarang Wi (위사랑) : Hyperledger Developer
 
# Dapp Structure

# Dapp서버사이드 통신구조 명세
 1. views/panel_home.pug : 모든 Dapp 기능은 싱글페이지에서 수행됩니다. view에서는 HTML/JQuery를 통해 사용자로부터 CDMO-Blockchain을 수행하기 위한 오더 및 데이터를 입력 받습니다.
 2. public/js/websocket.js : view에서 입력받은 내용은 이 부분에서 컨트롤 되고 있습니다. 사용자로부터 입력받은 오더와 데이터를 적합한 포맷으로 정형화하며, 이를 웹소켓을 통해 Node.js기반 서버로 전송합니다.
 3. 
 
