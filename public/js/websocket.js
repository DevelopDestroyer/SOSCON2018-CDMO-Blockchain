/* global new_block, $, document, WebSocket, escapeHtml, ws:true, start_up:true, known_companies:true, autoCloseNoticePanel:true */
/* global show_start_up_step, build_notification, build_user_panels, build_company_panel, populate_users_marbles, show_tx_step*/
/* global getRandomInt, block_ui_delay:true, build_a_tx, auditingMarble*/
/* exported transfer_marble, record_company, connect_to_server, refreshHomePanel, pendingTxDrawing*/

var getEverythingWatchdog = null;
var wsTxt = '[ws]';
var pendingTransaction = null;
var pendingTxDrawing = [];

// =================================================================================
// Socket Stuff
// =================================================================================
function connect_to_server() {
	var connected = false;
	var ws_keep_alive = null;
	connect();

	function connect() {
		var wsUri = null;
		if (document.location.protocol === 'https:') {
			wsTxt = '[wss]';
			wsUri = 'wss://' + document.location.hostname + ':' + document.location.port;
		} else {
			wsUri = 'ws://' + document.location.hostname + ':' + document.location.port;
		}
		console.log(wsTxt + ' Connecting to websocket', wsUri);

		ws = new WebSocket(wsUri);
		ws.onopen = function (evt) { onOpen(evt); };
		ws.onclose = function (evt) { onClose(evt); };
		ws.onmessage = function (evt) { onMessage(evt); };
		ws.onerror = function (evt) { onError(evt); };
	}

	function onOpen(evt) {
		console.log(wsTxt + ' CONNECTED');
		addshow_notification(build_notification(false, 'Connected to Marbles application'), false);
		connected = true;

		clearInterval(ws_keep_alive);
		ws_keep_alive = setInterval(function () {
			ws.send(JSON.stringify({ type: 'ping' }));
			console.log(wsTxt + ' ping sent');								// send a keep alive faster than 2 minutes
		}, 90 * 1000);
	}

	function onClose(evt) {
		clearInterval(ws_keep_alive);
		setTimeout(() => {
			console.log(wsTxt + ' DISCONNECTED', evt);
			connected = false;
			addshow_notification(build_notification(true, 'Lost connection to Marbles application'), true);
			setTimeout(function () { connect(); }, 5000);					//try again one more time, server restarts are quick
		}, 1000);
	}

	function onMessage(msg) {
		try {
			var msgObj = JSON.parse(msg.data);

			//marbles
			if (msgObj.msg === 'everything') {
				console.log(wsTxt + ' rec', msgObj.msg, msgObj);
				clearTimeout(getEverythingWatchdog);
				clearTimeout(pendingTransaction);
				$('#appStartingText').hide();
				clear_trash();
				build_user_panels(msgObj.everything.owners);
				for (var i in msgObj.everything.marbles) {
					populate_users_marbles(msgObj.everything.marbles[i]);
				}

				start_up = false;
				$('.marblesWrap').each(function () {
					if ($(this).find('.innerMarbleWrap').find('.ball').length === 0) {
						$(this).find('.noMarblesMsg').show();
					}
				});
			}
			else if(msgObj.msg === 'login_result'){
				if(msgObj.result == 'success'){
					loginSuccess(msgObj.user_id, msgObj.user_name, msgObj.group_id, msgObj.group_name);
				}
				else{
					alert("아이디 또는 비밀번호가 잘못되었습니다.");
				}
			}
			
			
			else if(msgObj.msg === 'read_product'){
				console.log("[ws] read_product : ok respone => msg : " + msgObj.msg);
				console.log("[ws] read_product : ok respone => data : " + msgObj);
				console.log("[ws] read_product : ok respone => product : " + msgObj.product);
				//alert("22 : " + msgObj.everything.product[1].productid);

				if(READ_TARGET=="product"){
					drawProductList(msgObj.everything.product);
				}
				
				else if(READ_TARGET=="material"){
					drawMaterialList(msgObj.everything.materials);
				}
				
				else if(READ_TARGET=="contract"){
					drawContractList(msgObj.everything.contracts);
				}
				
				else if(READ_TARGET=="all"){
				}
			}

			//marbles
			else if (msgObj.msg === 'users_marbles') {
				console.log(wsTxt + ' rec', msgObj.msg, msgObj);
				populate_users_marbles(msgObj);
			}

			// block
			else if (msgObj.msg === 'block') {
				console.log(wsTxt + ' rec', msgObj.msg, ': ledger blockheight', msgObj.block_height);
				if (msgObj.block_delay) block_ui_delay = msgObj.block_delay * 2;				// should be longer than block delay
				new_block(msgObj.block_height);													// send to blockchain.js

				if ($('#auditContentWrap').is(':visible')) {
					var obj = {
						type: 'audit',
						marble_id: auditingMarble.id
					};
					ws.send(JSON.stringify(obj));
				}
				
				//regist_product => $('#openProductListInterface').trigger('click');
				//regist_material => $('#openMaterialListInterfaceForSupply').trigger('click');
				//request_contract => alert('데이터 요청이 완료 되었습니다.');
				//confirm_contract => $('#openMaterialListInterfaceForSupply').trigger('click');
				if(WHAT_ABOUT_WAITING_RESULT == 'regist_product'){
					WHAT_ABOUT_WAITING_RESULT = 'x';
					$('#openProductListInterface').trigger('click');
				}
				else if(WHAT_ABOUT_WAITING_RESULT == 'regist_material'){
					WHAT_ABOUT_WAITING_RESULT = 'x';
					$('#openMaterialListInterfaceForSupply').trigger('click');
				}
				else if(WHAT_ABOUT_WAITING_RESULT == 'request_contract'){
					WHAT_ABOUT_WAITING_RESULT = 'x';
					alert('원재료 배송 요청에 대한 트랜잭션이 성공적으로 수행되었습니다.');
				}
				else if(WHAT_ABOUT_WAITING_RESULT == 'confirm_contract'){
					WHAT_ABOUT_WAITING_RESULT = 'x';
					$('#openMaterialListInterfaceForSupply').trigger('click');
				}
				
				
			}

			//marble owners
			else if (msgObj.msg === 'owners') {
				console.log(wsTxt + ' rec', msgObj.msg, msgObj);
				clearTimeout(getEverythingWatchdog);
				build_user_panels(msgObj.owners);
				console.log(wsTxt + ' sending get_marbles msg');
			}

			//transaction error
			else if (msgObj.msg === 'tx_error') {
				console.log(wsTxt + ' rec', msgObj.msg, msgObj);
				if (msgObj.e) {
					var err_msg = (msgObj.e.parsed) ? msgObj.e.parsed : msgObj.e;
					addshow_notification(build_notification(true, escapeHtml(err_msg)), true);
					$('#txStoryErrorTxt').html(err_msg);
					$('#txStoryErrorWrap').show();
				}
			}

			//all marbles sent
			else if (msgObj.msg === 'all_marbles_sent') {
				console.log(wsTxt + ' rec', msgObj.msg, msgObj);
				start_up = false;

				$('.marblesWrap').each(function () {
					console.log('checking', $(this).attr('owner_id'), $(this).find('.innerMarbleWrap').find('.ball').length);
					if ($(this).find('.innerMarbleWrap').find('.ball').length === 0) {
						$(this).find('.noMarblesMsg').show();
					}
				});
			}

			//app startup state
			else if (msgObj.msg === 'app_state') {
				console.log(wsTxt + ' rec', msgObj.msg, msgObj);
				setTimeout(function () {
					show_start_up_step(msgObj);
				}, 1000);
			}

			//tx state
			else if (msgObj.msg === 'tx_step') {
				console.log(wsTxt + ' rec', msgObj.msg, msgObj);
				show_tx_step(msgObj);
			}

			//tx history
			else if (msgObj.msg === 'history') {
				console.log(wsTxt + ' rec', msgObj.msg, msgObj);
				var built = 0;
				var x = 0;
				var count = $('.txDetails').length;

				for (x in pendingTxDrawing) clearTimeout(pendingTxDrawing[x]);

				if (count <= 0) {									//if no tx shown yet, append to back
					$('.txHistoryWrap').html('');					//clear
					for (x = msgObj.data.parsed.length - 1; x >= 0; x--) {
						built++;
						slowBuildtx(msgObj.data.parsed[x], x, built);
					}

				} else {											//if we already showing tx, prepend to front
					console.log('skipping tx', count);
					for (x = msgObj.data.parsed.length - 1; x >= count; x--) {
						var html = build_a_tx(msgObj.data.parsed[x], x);
						$('.txHistoryWrap').prepend(html);
						$('.txDetails:first').animate({ opacity: 1, left: 0 }, 600, function () {
							//after animate
						});
					}
				}
			}

			//general error
			else if (msgObj.msg === 'error') {
				console.log(wsTxt + ' rec', msgObj.msg, msgObj);
				if (msgObj.e && msgObj.e.parsed) {
					addshow_notification(build_notification(true, escapeHtml(msgObj.e.parsed)), true);
				} else if (msgObj.e) {
					addshow_notification(build_notification(true, escapeHtml(msgObj.e)), true);
				}
			}

			//unknown
			else console.log(wsTxt + ' rec', msgObj.msg, msgObj);
		}
		catch (e) {
			console.log(wsTxt + ' error handling a ws message', e);
		}
	}

	function onError(evt) {
		console.log(wsTxt + ' ERROR ', evt);
	}
}


// =================================================================================
// Helper Fun
// ================================================================================
//show admin panel page
function refreshHomePanel() {
	clearTimeout(pendingTransaction);
	pendingTransaction = setTimeout(function () {								//need to wait a bit
		get_everything_or_else();
	}, block_ui_delay);
}

//transfer_marble selected ball to user
function transfer_marble(marbleId, to_owner_id) {
	show_tx_step({ state: 'building_proposal' }, function () {
		var obj = {
			type: 'transfer_marble',
			id: marbleId,
			owner_id: to_owner_id,
			v: 1
		};
		console.log(wsTxt + ' sending transfer marble msg', obj);
		ws.send(JSON.stringify(obj));
		refreshHomePanel();
	});
}

//record the compan, show notice if its new
function record_company(company) {
	if (known_companies[company]) return;										//if i've seen it before, stop

	// -- Show the new company Notification -- //
	if (start_up === false) {
		console.log('[ui] this is a new company! ' + company);
		addshow_notification(build_notification(false, 'Detected a new company "' + company + '"!'), true);
	}

	build_company_panel(company);
	if (start_up === true) addshow_notification(build_notification(false, 'Detected company "' + company + '".'), false);

	console.log('[ui] recorded company ' + company);
	known_companies[company] = {
		name: company,
		count: 0,
		visible: 0
	};
}

//add notification to the panel, show panel now if you want with 2nd param
function addshow_notification(html, expandPanelNow) {
	$('#emptyNotifications').hide();
	$('#noticeScrollWrap').prepend(html);

	var i = 0;
	$('.notificationWrap').each(function () {
		i++;
		if (i > 10) $(this).remove();
	});

	if (expandPanelNow === true) {
		openNoticePanel();
		clearTimeout(autoCloseNoticePanel);
		autoCloseNoticePanel = setTimeout(function () {		//auto close, xx seconds from now
			closeNoticePanel();
		}, 10000);
	}
}

//open the notice panel
function openNoticePanel() {
	$('#noticeScrollWrap').slideDown();
	$('#notificationHandle').children().removeClass('fa-angle-down').addClass('fa-angle-up');
}

//close the notice panel
function closeNoticePanel() {
	$('#noticeScrollWrap').slideUp();
	$('#notificationHandle').children().removeClass('fa-angle-up').addClass('fa-angle-down');
	clearTimeout(autoCloseNoticePanel);
}

//get everything with timeout to get it all again!
function get_everything_or_else(attempt) {
	console.log(wsTxt + ' sending get everything msg');
	clearTimeout(getEverythingWatchdog);
	ws.send(JSON.stringify({ type: 'read_everything', v: 1 }));

	if (!attempt) attempt = 1;
	else attempt++;

	getEverythingWatchdog = setTimeout(function () {
		if (attempt <= 3) {
			console.log('\n\n! [timeout] did not get owners in time, impatiently calling it again', attempt, '\n\n');
			get_everything_or_else(attempt);
		}
		else {
			console.log('\n\n! [timeout] did not get owners in time, hopeless', attempt, '\n\n');
		}
	}, 5000 + getRandomInt(0, 10000));
}

//emtpy trash marble wrap
function clear_trash() {
	$('#trashbin .ball').fadeOut();
	setTimeout(function () {
		$('#trashbin .ball').remove();
	}, 500);
}

// delay build each transaction
function slowBuildtx(data, txNumber, built) {
	pendingTxDrawing.push(setTimeout(function () {
		var html = build_a_tx(data, txNumber);
		$('.txHistoryWrap').append(html);
		$('.txDetails:last').animate({ opacity: 1, left: 0 }, 600, function () {
			//after animate
		});
	}, (built * 150)));
}


function drawProductList(data){
	var tableBuff = new Array();
	var tmpHTML = '';
	/*
	var tmpObj = {};
	tmpObj.groupname = '';
	tmpObj.productname = '';
	tmpObj.productweight = '';
	tmpObj.productvolume = '';
	tmpObj.mainingredientname = '';
	tmpObj.total = 0;
	*/
	
	for(var i = 0; i < data.length; i++){
		if(data[i].groupname == GROUP_NAME){
			//새로 구조체 생성
			if(tableBuff[data[i].productname] == null){
				/*
				tmpObj.groupname = data[i].groupname;
				tmpObj.productname = data[i].productname;
				tmpObj.productweight = data[i].productweight;
				tmpObj.productvolume = data[i].productvolume;
				tmpObj.mainingredientname = data[i].mainingredientname;
				tmpObj.total = data[i].forcoin;
				
				tableBuff[data[i].productname] = tmpObj;
				*/

				tableBuff[data[i].productname] = productListNodeMaker(data[i]);
				
			}
			//더하기 작업만 수행
			else{
				tableBuff[data[i].productname].total += data[i].forcoin;
			}
			
		}
	}
	
	tmpHTML += '<table>';
	tmpHTML += '	<tr>';
	tmpHTML += '		<th>그룹명</th>';
	tmpHTML += '		<th>제품명</th>';
	//tmpHTML += '		<th>제품용량</th>';
	tmpHTML += '		<th>주원료명</th>';
	tmpHTML += '		<th>제품 1개 주원료 함유량(g)</th>';
	tmpHTML += '		<th>제품보유량(개)</th>';
	tmpHTML += '	</tr>';
		
    for (x in tableBuff) {
        //text += tableBuff[x].groupname + " ";

		tmpHTML += '<tr>';
		tmpHTML += '	<td>'+ tableBuff[x].groupname + '</td>';
		tmpHTML += '	<td>'+ tableBuff[x].productname + '</td>';
		//tmpHTML += '	<td>'+ tableBuff[x].productvolume + '</td>';
		tmpHTML += '	<td>'+ tableBuff[x].mainingredientname + '</td>';
		tmpHTML += '	<td>'+ tableBuff[x].productweight + '</td>';
		tmpHTML += '	<td>'+ tableBuff[x].total + '</td>';
		tmpHTML += '</tr>';
    }
	tmpHTML += '</table>';
	$('#productListTable').html(tmpHTML);
	
	enableMenu('productListPannel');
}

function productListNodeMaker(dd){
	var tmpObj = {};
	/*
	tmpObj.groupname = '';
	tmpObj.productname = '';
	tmpObj.productweight = '';
	tmpObj.productvolume = '';
	tmpObj.mainingredientname = '';
	tmpObj.total = 0;
	*/
	
	tmpObj.groupname = dd.groupname;
	tmpObj.productname = dd.productname;
	tmpObj.productweight = dd.productweight;
	tmpObj.productvolume = dd.productvolume;
	tmpObj.mainingredientname = dd.mainingredientname;
	tmpObj.total = dd.forcoin;
	
	
	return tmpObj;
}


/////////material list maker
function drawMaterialList(data){
	var tableBuff = new Array();
	var tmpHTML = '';

	for(var i = 0; i < data.length; i++){
		if(data[i].groupname == GROUP_NAME){
			//새로 구조체 생성
			if(tableBuff[data[i].materialname] == null){
				tableBuff[data[i].materialname] = materialListNodeMaker(data[i]);
			}
			//더하기 작업만 수행
			else{
				tableBuff[data[i].materialname].total += data[i].forcoin;
			}
			
		}
	}
	/*
							<th>그룹명</th>
						<th>원재료명</th>
						<th>원재료 무게단위</th>
						<th>원재료 보유량</th>
	*/
	tmpHTML += '<table>';
	tmpHTML += '	<tr>';
	tmpHTML += '		<th>그룹명</th>';
	tmpHTML += '		<th>원재료명</th>';
	tmpHTML += '		<th>원재료 보유량(g)</th>';
	tmpHTML += '	</tr>';
		
    for (x in tableBuff) {
        //text += tableBuff[x].groupname + " ";

		tmpHTML += '<tr>';
		tmpHTML += '	<td>'+ tableBuff[x].groupname + '</td>';
		tmpHTML += '	<td>'+ tableBuff[x].materialname + '</td>';
		tmpHTML += '	<td>'+ tableBuff[x].total + 'g</td>';
		tmpHTML += '</tr>';
    }
	tmpHTML += '</table>';
	$('#materialListTable').html(tmpHTML);
	
	enableMenu('materialListPannel');
}

function materialListNodeMaker(dd){
	var tmpObj = {};
	tmpObj.total = 0;
	
	tmpObj.groupname = dd.groupname;
	tmpObj.materialname = dd.materialname;
	tmpObj.materialweight = dd.materialweight;
	tmpObj.total = dd.forcoin;
	
	
	return tmpObj;
}

//contractListTable
function drawContractList(data){
	var tableBuff = new Array();
	var tmpHTML = '';

	for(var i = 0; i < data.length; i++){
		//if(data[i].groupname == GROUP_NAME){
			//새로 구조체 생성
			if(tableBuff[data[i].materialid] == null){
				tableBuff[data[i].materialid] = contractListNodeMaker(data[i]);
			}
			//이미 있을 경우 빈 필드를 채워준다
			else{
				if(tableBuff[data[i].materialid].registerdevelopuserid == '-' && '-' != data[i].registerdevelopuserid){
					tableBuff[data[i].materialid].registerdevelopuserid = data[i].registerdevelopuserid;
				}
				if(tableBuff[data[i].materialid].registerdevelopusername == '-' && '-' != data[i].registerdevelopusername){
					tableBuff[data[i].materialid].registerdevelopusername = data[i].registerdevelopusername;
				}
				if(tableBuff[data[i].materialid].registersupplyuserid == '-' && '-' != data[i].registersupplyuserid){
					tableBuff[data[i].materialid].registersupplyuserid = data[i].registersupplyuserid;
				}
				if(tableBuff[data[i].materialid].registersupplyusername == '-' && '-' != data[i].registersupplyusername){
					tableBuff[data[i].materialid].registersupplyusername = data[i].registersupplyusername;
				}
				
				if(tableBuff[data[i].materialid].supplygroupid == '-' && '-' != data[i].supplygroupid){
					tableBuff[data[i].materialid].supplygroupid = data[i].supplygroupid;
				}
				if(tableBuff[data[i].materialid].supplygroupname == '-' && '-' != data[i].supplygroupname){
					tableBuff[data[i].materialid].supplygroupname = data[i].supplygroupname;
				}
				if(tableBuff[data[i].materialid].developgroupid == '-' && '-' != data[i].developgroupid){
					tableBuff[data[i].materialid].developgroupid = data[i].developgroupid;
				}
				if(tableBuff[data[i].materialid].developgroupname == '-' && '-' != data[i].developgroupname){
					tableBuff[data[i].materialid].developgroupname = data[i].developgroupname;
				}
				
			}
			
		//}
	}
	/*
							<th>그룹명</th>
						<th>원재료명</th>
						<th>원재료 무게단위</th>
						<th>원재료 보유량</th>
	*/
	tmpHTML += '<table>';
	tmpHTML += '	<tr>';
	tmpHTML += '		<th>계약번호</th>';
	tmpHTML += '		<th>요청자</th>';
	tmpHTML += '		<th>요청 원재료</th>';
	tmpHTML += '		<th>요청량(g)</th>';
	tmpHTML += '		<th>승인</th>';
	tmpHTML += '	</tr>';
		
    for (x in tableBuff) {
        //text += tableBuff[x].groupname + " ";

		tmpHTML += '<tr>';
		tmpHTML += '	<td>'+ tableBuff[x].materialid + '</td>';
		tmpHTML += '	<td>'+ tableBuff[x].registerdevelopusername + '</td>';
		tmpHTML += '	<td>'+ tableBuff[x].materialname + '</td>';
		tmpHTML += '	<td>'+ tableBuff[x].total + 'g</td>';
		if(tableBuff[x].registersupplyuserid == '-'){
			tmpHTML += "<td id='td" + tableBuff[x].materialid + "'>";
			tmpHTML += "	<button style=\"background-color:#555758;\" onclick=\"contractConfirm('"+tableBuff[x].developgroupid+"','"+tableBuff[x].developgroupname+"',"+tableBuff[x].total+",'"+tableBuff[x].isdevelopgroupconfirm+"','"+tableBuff[x].issupplygroupconfirm+"','"+tableBuff[x].materialid+"','"+tableBuff[x].materialname+"','"+tableBuff[x].materialweight+"','"+tableBuff[x].registerdevelopuserid+"','"+tableBuff[x].registerdevelopusername+"','"+USER_ID+"','"+USER_NAME+"','"+GROUP_ID+"','"+GROUP_NAME+"');\">";
			tmpHTML += "		<span class='fa fa-check'></span>";
			tmpHTML += '		<span>  승인하기</span>';
			tmpHTML += '	</button>	';
			tmpHTML += '</td>';
			
			/*
								<button id="materialReqOKButton" style="background-color:#555758;">
									<span class="fa fa-check"></span>
									<span>  승인하기</span>
								</button>
			*/
		}
		else{
			tmpHTML += '	<td>승인완료</td>';
		}
		tmpHTML += '</tr>';
    }
	tmpHTML += '</table>';
	$('#contractListTable').html(tmpHTML);
	
	enableMenu('materialReqCheckPannel');
}

function contractListNodeMaker(dd){
	var tmpObj = {};
	tmpObj.total = 0;
	
	tmpObj.developgroupid = dd.developgroupid;
	tmpObj.developgroupname = dd.developgroupname;
	tmpObj.isdevelopgroupconfirm = dd.isdevelopgroupconfirm;
	tmpObj.issupplygroupconfirm = dd.issupplygroupconfirm;
	tmpObj.materialid = dd.materialid;
	tmpObj.materialname = dd.materialname;
	tmpObj.materialweight = dd.materialweight;
	tmpObj.registerdevelopuserid = dd.registerdevelopuserid;
	tmpObj.registerdevelopusername = dd.registerdevelopusername;
	tmpObj.registersupplyuserid = dd.registersupplyuserid;
	tmpObj.registersupplyusername = dd.registersupplyusername;
	tmpObj.supplygroupid = dd.supplygroupid;
	tmpObj.supplygroupname = dd.supplygroupname;
	tmpObj.total = dd.forcoin;
	
	
	return tmpObj;
}

function contractConfirm(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14){
	console.log('contract confirm and complete. start regist!');
	WHAT_ABOUT_WAITING_RESULT = "confirm_contract";
	var obj = {
		type: 'contract_regist',
		developgroupid: a1,
		developgroupname: a2,
		forcoin: String(a3),
		isdevelopgroupconfirm: a4, 
		issupplygroupconfirm: a5,
		materialid: a6,
		materialname: a7,
		materialweight: a8,
		registerdevelopuserid: a9,
		registerdevelopusername: a10,
		registersupplyuserid: a11,
		registersupplyusername: a12,
		supplygroupid: a13,
		supplygroupname: a14
	};
	ws.send(JSON.stringify(obj));		
	$('#td' + a6).html('승인완료');
	
	
	//////원료 교환 처리
	var obj_supply = {
		type: 'material_regist',
		groupid: a13,
		groupname: a14,
		registeruserid : a11,
		registerusername : a12,
		materialname: a7,
		registerdate: 'contract',
		materialweight: a8,
		forcoin: String(a3 * (-1))
	};
	ws.send(JSON.stringify(obj_supply));
	
	
	
	//////원료 교환 처리
	var obj_develop = {
		type: 'material_regist',
		groupid: a1,
		groupname: a2,
		registeruserid : a9,
		registerusername : a10,
		materialname: a7,
		registerdate: 'contract',
		materialweight: a8,
		forcoin: String(a3)
	};
	ws.send(JSON.stringify(obj_develop));


	return false;
}