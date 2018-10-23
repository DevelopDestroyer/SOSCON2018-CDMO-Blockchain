/* global $, window, document */
/* global toTitleCase, connect_to_server, refreshHomePanel, closeNoticePanel, openNoticePanel, show_tx_step, marbles*/
/* global pendingTxDrawing:true */
/* exported record_company, autoCloseNoticePanel, start_up, block_ui_delay*/
var ws = {};
var bgcolors = ['whitebg', 'blackbg', 'redbg', 'greenbg', 'bluebg', 'purplebg', 'pinkbg', 'orangebg', 'yellowbg'];
var autoCloseNoticePanel = null;
var known_companies = {};
var start_up = true;
var lsKey = 'marbles';
var fromLS = {};
var block_ui_delay = 15000; 								//default, gets set in ws block msg
var auditingMarble = null;

var READ_TARGET = "product";
var WHAT_ABOUT_WAITING_RESULT = "x";	//regist_product => $('#openProductListInterface').trigger('click');
										//regist_material => $('#openMaterialListInterfaceForSupply').trigger('click');
										//request_contract => alert('데이터 요청이 완료 되었습니다.');
										//confirm_contract => $('#openMaterialListInterfaceForSupply').trigger('click');
var USER_ID = "leeth77";
var USER_NAME = "이태호";
var GROUP_ID = "sangmyung";
var GROUP_NAME = "상명제약";

// =================================================================================
// On Load
// =================================================================================
$(document).on('ready', function () {
	fromLS = window.localStorage.getItem(lsKey);
	if (fromLS) fromLS = JSON.parse(fromLS);
	else fromLS = { story_mode: false };					//dsh todo remove this
	console.log('from local storage', fromLS);

	connect_to_server();

	// =================================================================================
	// jQuery UI Events
	// =================================================================================
	$('#createMarbleButton').click(function () {
		console.log('creating marble');
		var obj = {
			type: 'create',
			color: $('.colorSelected').attr('color'),
			size: $('select[name="size"]').val(),
			username: $('select[name="user"]').val(),
			company: $('input[name="company"]').val(),
			owner_id: $('input[name="owner_id"]').val(),
			v: 1
		};
		console.log('creating marble, sending', obj);
		$('#createPanel').fadeOut();
		$('#tint').fadeOut();

		show_tx_step({ state: 'building_proposal' }, function () {
			ws.send(JSON.stringify(obj));

			refreshHomePanel();
			$('.colorValue').html('Color');											//reset
			for (var i in bgcolors) $('.createball').removeClass(bgcolors[i]);		//reset
			$('.createball').css('border', '2px dashed #fff');						//reset
		});

		return false;
	});


	$('#productRegistButton').click(function () {
		console.log('start product regist!');
		WHAT_ABOUT_WAITING_RESULT = "regist_product";

		var obj = {
			type: 'product_regist',
			groupid: GROUP_ID,
			groupname: GROUP_NAME,
			registeruserid : USER_ID,
			registerusername : USER_NAME,
			//productid: "",
			registerdate: $('#productRegist_RegisterDate').val(),
			productname: $('#productRegist_ProductName').val(),
			productweight: $('#productRegist_ProductWeight').val(),
			productvolume: $('#productRegist_ProductVolume').val(),
			mainingredientname: $('#productRegist_MainIngredientName').val(),
			forcoin: $('#productRegist_forcoin').val()

		};
		console.log('product, sending', obj);
		ws.send(JSON.stringify(obj));

		
		//재료 감소
		//////원료 교환 처리
		var obj_mater = {
			type: 'material_regist',
			groupid: GROUP_ID,
			groupname: GROUP_NAME,
			registeruserid : USER_ID,
			registerusername : USER_NAME,
			materialname: $('#productRegist_MainIngredientName').val(),
			registerdate: $('#productRegist_RegisterDate').val(),
			materialweight: 'from product register',
			forcoin: String($('#productRegist_ProductWeight').val() * $('#productRegist_forcoin').val() * (-1))
		};
		ws.send(JSON.stringify(obj_mater));
			

		return false;
	});

	$('#materialRegistButton').click(function () {
		//alert('start material regist!');
		console.log('start material regist!');
		WHAT_ABOUT_WAITING_RESULT = "regist_material";

		var obj = {
			type: 'material_regist',
			groupid: GROUP_ID,
			groupname: GROUP_NAME,
			registeruserid : USER_ID,
			registerusername : USER_NAME,
			//materialid: $('#productRegist_ProductID').val(),
			materialname: $('#materialRegist_materialName').val(),
			registerdate: $('#materialRegist_registerDate').val(),
			materialweight: $('#materialRegist_materialWeight').val(),
			forcoin: $('#materialRegist_forcoin').val()
		};
			ws.send(JSON.stringify(obj));

		return false;
	});
	
	//materialReqButton
	$('#materialReqButton').click(function () {
		//alert('start material regist!');
		console.log('start contract regist!');
		WHAT_ABOUT_WAITING_RESULT = "request_contract";
/*
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
*/

		var obj = {
			type: 'contract_regist',
			supplygroupid: "-",
			supplygroupname: "-",
			developgroupid : GROUP_ID,
			developgroupname : GROUP_NAME,
			registersupplyuserid : "-",
			registerdevelopuserid : USER_ID,
			registersupplyusername : "-",
			registerdevelopusername : USER_NAME,
			issupplygroupconfirm : "ok",
			isdevelopgroupconfirm :  "ok",
			materialid : $('#materialReq_ContractNum').val(),
			materialname : $('#materialReq_materialName').val(),
			//weight는 등록일로 사용할 것임
			materialweight : $('#materialReq_RegisterDate').val(),
			forcoin : $('#materialReq_forcoin').val()
		};
			ws.send(JSON.stringify(obj));

		return false;
	});


	
	
	$('#user_LoginButton').click(function () {
		//로그인 요청
		var obj = {
				type: 'login_req',
				id: $('#user_id').val(),
				pw: $('#user_pw').val()
			};

			ws.send(JSON.stringify(obj));
			//alert('웹소켓 product read호출완료,,,');
		//show_tx_step({ state: 'building_proposal' }, function () {

			//refreshHomePanel();
			//$('.colorValue').html('Color');											//reset
			//for (var i in bgcolors) $('.createball').removeClass(bgcolors[i]);		//reset
			//$('.createball').css('border', '2px dashed #fff');						//reset
		//});

		return false;
	});

	$('#user_LogoutButton').click(function () {
		jQuery('#userInfoLogOffMode').css("display", "block");
		jQuery('#userInfoLogInMode').css("display", "none");
		
		jQuery('#userInterfacePannel').css("display", "none");

		enableMenu('alloff');
		return false;
	});

	//
	// 대시보드 버튼들 이벤트 리스너
	//
	$('#openProductRegistInterface').click(function () {
		enableMenu('productRegistPanel');

		return false;
	});
	
	$('#openReqMatertialInterface').click(function () {
		enableMenu('materialReqPanel');

		return false;
	});
	
	$('#openProductListInterface').click(function () {
		console.log('start product read!');
		READ_TARGET = "product";
		//제품 리스트 요청
		//서버사이드로 바로 감
		var obj = {
			type: 'read_product_req'
			};

			ws.send(JSON.stringify(obj));
			//alert('웹소켓 product read호출완료,,,');
		//show_tx_step({ state: 'building_proposal' }, function () {

			//refreshHomePanel();
			//$('.colorValue').html('Color');											//reset
			//for (var i in bgcolors) $('.createball').removeClass(bgcolors[i]);		//reset
			//$('.createball').css('border', '2px dashed #fff');						//reset
		//});

		return false;
	});	

	$('#openMaterialListInterfaceForDevelop').click(function () {
		READ_TARGET = "material";
		//재료 리스트 요청
		//서버사이드로 바로 감
		var obj = {
			type: 'read_product_req'
			};

			ws.send(JSON.stringify(obj));


		return false;
	});	

	$('#openMaterialListInterfaceForSupply').click(function () {
		READ_TARGET = "material";
		//재료 리스트 요청
		//서버사이드로 바로 감
		var obj = {
			type: 'read_product_req'
			};

			ws.send(JSON.stringify(obj));


		return false;
	});	

	$('#openResponseMatertialInterface').click(function () {
		READ_TARGET = "contract";
		//재료 리스트 요청
		//서버사이드로 바로 감
		var obj = {
			type: 'read_product_req'
			};

			ws.send(JSON.stringify(obj));


		return false;
	});		
	
	$('#openMaterialRegistInterface').click(function () {
		enableMenu('materialRegistPannel');

		return false;
	});	
	
	//fix marble owner panel (don't filter/hide it)
	$(document).on('click', '.marblesFix', function () {
		if ($(this).parent().parent().hasClass('marblesFixed')) {
			$(this).parent().parent().removeClass('marblesFixed');
		}
		else {
			$(this).parent().parent().addClass('marblesFixed');
		}
	});

	//marble color picker
	$(document).on('click', '.colorInput', function () {
		$('.colorOptionsWrap').hide();											//hide any others
		$(this).parent().find('.colorOptionsWrap').show();
	});
	$(document).on('click', '.colorOption', function () {
		var color = $(this).attr('color');
		var html = '<span class="fa fa-circle colorSelected ' + color + '" color="' + color + '"></span>';

		$(this).parent().parent().find('.colorValue').html(html);
		$(this).parent().hide();

		for (var i in bgcolors) $('.createball').removeClass(bgcolors[i]);		//remove prev color
		$('.createball').css('border', '0').addClass(color + 'bg');				//set new color
	});

	//username/company search
	$('#searchUsers').keyup(function () {
		var count = 0;
		var input = $(this).val().toLowerCase();
		for (var i in known_companies) {
			known_companies[i].visible = 0;
		}

		//reset - clear search
		if (input === '') {
			$('.marblesWrap').show();
			count = $('#totalUsers').html();
			$('.companyPanel').fadeIn();
			for (i in known_companies) {
				known_companies[i].visible = known_companies[i].count;
				$('.companyPanel[company="' + i + '"]').find('.companyVisible').html(known_companies[i].visible);
				$('.companyPanel[company="' + i + '"]').find('.companyCount').html(known_companies[i].count);
			}
		}
		else {
			var parts = input.split(',');
			console.log('searching on', parts);

			//figure out if the user matches the search
			$('.marblesWrap').each(function () {												//iter on each marble user wrap
				var username = $(this).attr('username');
				var company = $(this).attr('company');
				if (username && company) {
					var full = (username + company).toLowerCase();
					var show = false;

					for (var x in parts) {													//iter on each search term
						if (parts[x].trim() === '') continue;
						if (full.indexOf(parts[x].trim()) >= 0 || $(this).hasClass('marblesFixed')) {
							count++;
							show = true;
							known_companies[company].visible++;								//this user is visible
							break;
						}
					}

					if (show) $(this).show();
					else $(this).hide();
				}
			});

			//show/hide the company panels
			for (i in known_companies) {
				$('.companyPanel[company="' + i + '"]').find('.companyVisible').html(known_companies[i].visible);
				if (known_companies[i].visible === 0) {
					console.log('hiding company', i);
					$('.companyPanel[company="' + i + '"]').fadeOut();
				}
				else {
					$('.companyPanel[company="' + i + '"]').fadeIn();
				}
			}
		}
		//user count
		$('#foundUsers').html(count);
	});

	//login events
	$('#whoAmI').click(function () {													//drop down for login
		if ($('#userSelect').is(':visible')) {
			$('#userSelect').fadeOut();
			$('#carrot').removeClass('fa-angle-up').addClass('fa-angle-down');
		}
		else {
			$('#userSelect').fadeIn();
			$('#carrot').removeClass('fa-angle-down').addClass('fa-angle-up');
		}
	});

	//open create marble panel
	$(document).on('click', '.addMarble', function () {
		$('#tint').fadeIn();
		$('#createPanel').fadeIn();
		var company = $(this).parents('.innerMarbleWrap').parents('.marblesWrap').attr('company');
		var username = $(this).parents('.innerMarbleWrap').parents('.marblesWrap').attr('username');
		var owner_id = $(this).parents('.innerMarbleWrap').parents('.marblesWrap').attr('owner_id');
		$('select[name="user"]').html('<option value="' + username + '">' + toTitleCase(username) + '</option>');
		$('input[name="company"]').val(company);
		$('input[name="owner_id"]').val(owner_id);
	});

	//close create marble panel
	$('#tint').click(function () {
		if ($('#startUpPanel').is(':visible')) return;
		if ($('#txStoryPanel').is(':visible')) return;
		$('#createPanel, #tint, #settingsPanel').fadeOut();
	});

	//notification drawer
	$('#notificationHandle').click(function () {
		if ($('#noticeScrollWrap').is(':visible')) {
			closeNoticePanel();
		}
		else {
			openNoticePanel();
		}
	});

	//hide a notification
	$(document).on('click', '.closeNotification', function () {
		$(this).parents('.notificationWrap').fadeOut();
	});

	//settings panel
	$('#showSettingsPanel').click(function () {
		$('#settingsPanel, #tint').fadeIn();
	});
	$('#closeSettings').click(function () {
		$('#settingsPanel, #tint').fadeOut();
	});

	//story mode selection
	$('#disableStoryMode').click(function () {
		set_story_mode('off');
	});
	$('#enableStoryMode').click(function () {
		set_story_mode('on');
	});

	//close create panel
	$('#closeCreate').click(function () {
		$('#createPanel, #tint').fadeOut();
	});

	//change size of marble
	$('select[name="size"]').click(function () {
		var size = $(this).val();
		if (size === '16') $('.createball').animate({ 'height': 150, 'width': 150 }, { duration: 200 });
		else $('.createball').animate({ 'height': 250, 'width': 250 }, { duration: 200 });
	});

	//right click opens audit on marble
	$(document).on('contextmenu', '.ball', function () {
		auditMarble(this, true);
		return false;
	});

	//left click audits marble
	$(document).on('click', '.ball', function () {
		auditMarble(this, false);
	});

	function auditMarble(that, open) {
		var marble_id = $(that).attr('id');
		$('.auditingMarble').removeClass('auditingMarble');

		if (!auditingMarble || marbles[marble_id].id != auditingMarble.id) {//different marble than before!
			for (var x in pendingTxDrawing) clearTimeout(pendingTxDrawing[x]);
			$('.txHistoryWrap').html('');										//clear
		}

		auditingMarble = marbles[marble_id];
		console.log('\nuser clicked on marble', marble_id);

		if (open || $('#auditContentWrap').is(':visible')) {
			$(that).addClass('auditingMarble');
			$('#auditContentWrap').fadeIn();
			$('#marbleId').html(marble_id);
			var color = marbles[marble_id].color;
			for (var i in bgcolors) $('.auditMarble').removeClass(bgcolors[i]);	//reset
			$('.auditMarble').addClass(color.toLowerCase() + 'bg');

			$('#rightEverything').addClass('rightEverythingOpened');
			$('#leftEverything').fadeIn();

			var obj2 = {
				type: 'audit',
				marble_id: marble_id
			};
			ws.send(JSON.stringify(obj2));
		}
	}

	$('#auditClose').click(function () {
		$('#auditContentWrap').slideUp(500);
		$('.auditingMarble').removeClass('auditingMarble');												//reset
		for (var x in pendingTxDrawing) clearTimeout(pendingTxDrawing[x]);
		setTimeout(function () {
			$('.txHistoryWrap').html('<div class="auditHint">Click a Marble to Audit Its Transactions</div>');//clear
		}, 750);
		$('#marbleId').html('-');
		auditingMarble = null;

		setTimeout(function () {
			$('#rightEverything').removeClass('rightEverythingOpened');
		}, 500);
		$('#leftEverything').fadeOut();
	});

	$('#auditButton').click(function () {
		$('#auditContentWrap').fadeIn();
		$('#rightEverything').addClass('rightEverythingOpened');
		$('#leftEverything').fadeIn();
	});

	let selectedOwner = null;
	// show dialog to confirm if they want to disable the marble owner
	$(document).on('click', '.disableOwner', function () {
		$('#disableOwnerWrap, #tint').fadeIn();
		selectedOwner = $(this).parents('.marblesWrap');
	});

	// disable the marble owner
	$('#removeOwner').click(function () {
		var obj = {
			type: 'disable_owner',
			owner_id: selectedOwner.attr('owner_id')
		};
		ws.send(JSON.stringify(obj));
		selectedOwner.css('opacity', 0.4);
	});

	$('.closeDisableOwner, #removeOwner').click(function () {
		$('#disableOwnerWrap, #tint').fadeOut();
	});
});

//toggle story mode
function set_story_mode(setting) {
	if (setting === 'on') {
		fromLS.story_mode = true;
		$('#enableStoryMode').prop('disabled', true);
		$('#disableStoryMode').prop('disabled', false);
		$('#storyStatus').addClass('storyOn').html('on');
		window.localStorage.setItem(lsKey, JSON.stringify(fromLS));		//save
	}
	else {
		fromLS.story_mode = false;
		$('#disableStoryMode').prop('disabled', true);
		$('#enableStoryMode').prop('disabled', false);
		$('#storyStatus').removeClass('storyOn').html('off');
		window.localStorage.setItem(lsKey, JSON.stringify(fromLS));		//save
	}
}

function sosocon_test(){
	alert('its soscon test function');
}

function enableMenu(menuName){
	/*
		버튼 눌렀을때 발생하는 이벤트에서 해당 함수를
		호출하며, 파라미터로 그 버튼의 아이디값을 넘겨주면 된다.
	*/

	jQuery('#productRegistPanel').css("display", "none");
	jQuery('#productListPannel').css("display", "none");
	jQuery('#materialReqPanel').css("display", "none");
	jQuery('#materialListPannel').css("display", "none");
	jQuery('#materialRegistPannel').css("display", "none");
	jQuery('#materialReqCheckPannel').css("display", "none");

	if(menuName != 'alloff')
		jQuery('#' + menuName).css("display", "block");


}


function loginSuccess(u_id, u_name, g_id, g_name){
	USER_ID = u_id;
	USER_NAME = u_name;
	GROUP_ID = g_id;
	GROUP_NAME = g_name;
	var ment = GROUP_NAME + " 소속 " + USER_NAME + "님 반갑습니다.";
	$("#userIntroduce").html(ment);
	
	if(GROUP_ID == "develop"){
		jQuery('.supply_group_menu').css("display", "none");
		jQuery('.develop_group_menu').css("display", "block");
	}
	else if(GROUP_ID == "supply"){
		jQuery('.supply_group_menu').css("display", "block");
		jQuery('.develop_group_menu').css("display", "none");
	}
	
	jQuery('#userInfoLogOffMode').css("display", "none");
	jQuery('#userInfoLogInMode').css("display", "block");
	
	jQuery('#userInterfacePannel').css("display", "block");
}
