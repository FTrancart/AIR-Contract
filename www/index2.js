"use strict";
/*Variables to retrieve smart contracts ABIs*/
const g_contract = '0x01f8717cd25aE1f7fc4F135FA45ec1557c3430CC';
var g_instance_manager;
var g_equity_token_abi;
var g_aircontract_abi;
var g_cashtoken_abi;
var shareholders = 2;
var g_data = { nameToIdx : {}, companies: [] };

/*Format the input with thousand separators*/
const thousandsSep = {

	digitGroupSeparator : ' ',
	decimalPlaces : 0,
};

const thousandSepDollar = {
	digitGroupSeparator : ' ',
	decimalPlaces : 0,
	currencySymbol : "$",
}

function addFormat(id) {
	$(function() {
		new AutoNumeric(id, thousandsSep);
	})
}

function addFormatDol(id) {
	$(function() {
		new AutoNumeric(id, thousandSepDollar);
	})
}

function addMultipleFormat(id) {
	$(function() {
		new AutoNumeric.multiple(id, thousandsSep);
	})
}

function setValueAutonumeric(input, value) {
	$(function() {
		AutoNumeric.set(input, value);
	})
}

addMultipleFormat(".auto-thousandsSep");


function xhrget(url, headers, opts) {
	opts = opts || {};
	return new Promise(function(resolve, reject) {
		var req = new XMLHttpRequest();

		req.onloadend = function() {
			resolve(req);
		};

		if (opts.progress !== undefined) {
			req.onprogress = function(prog_ev) {
				opts.progress(req, prog_ev);
			};
		}
		if (opts.readystatechange !== undefined) {
			req.onreadystatechange = function() {
				opts.readystatechange(req);
			};
		}

		req.open('GET', url);

		for (var name in headers) {
			req.setRequestHeader(name, headers[name]);
		}

		try {
			req.send();
		} catch (err) {
			reject(err);
		}
	});
}

async function initWeb3()
{
	if (window.ethereum) {
		try {
			await window.ethereum.enable().then(account => {
				window.web3 = new Web3(ethereum);
				web3.eth.defaultAccount = account[0];
			});
		} catch (error) {
			console.log("error")
		}
	} else {
		/*Web Socket Infura pour Ropsten*/
		window.web3 = new Web3(new Web3.providers.WebsocketProvider('wss://ropsten.infura.io/ws',  {
			clientConfig: {
				maxReceivedFrameSize: 100000000,
				maxReceivedMessageSize: 100000000,
			}
		}));
	}
	var prom = new Promise( (resolve, reject) => {
		if (web3.currentProvider.connected) {
			resolve(web3);		
		}
		else if(window.ethereum) {
			resolve(web3);
		}
		web3.currentProvider.connection.onopen = function(ok) {
			console.log("Web socket connected");
			resolve(web3);
		}
		web3.currentProvider.connection.onerror = function(ok) {
			console.log("Error connecting");
			resolve(web3);
		}
		web3.currentProvider.connection.onclose = function(ok) {
			console.log("Error connection closed")
			resolve(web3);
		}
	});

	/*On rentre les abi depuis fichiers sources*/
	window.App = window.App || { LocalApp: true };
	var App = window.App;

	await xhrget('/abi/ManagerContract.json').then(res => {
		try {
			var jsonInstance = JSON.parse(res.responseText);
			g_instance_manager = new web3.eth.Contract(jsonInstance.abi, g_contract);		
		}
		catch(err) {
			console.log(err);
		}
	}); 

	await xhrget('/abi/EquityToken.json').then(res2 => {
		try {
			var jsonInstance2 = JSON.parse(res2.responseText);
			g_equity_token_abi = jsonInstance2.abi;
		} catch(err) {
			console.error(err);
		}
	});
	await xhrget('/abi/AIRContract.json').then(res3 => {
		try {
			var jsonInstance3 = JSON.parse(res3.responseText);
			g_aircontract_abi = jsonInstance3.abi;
		} catch(err) {
			console.error(err);
		}
	});
	await xhrget('/abi/ERC20Mintable.json').then(res4 => {
		try {
			var jsonInstance4 = JSON.parse(res4.responseText);
			g_cashtoken_abi = jsonInstance4.abi;
		} catch(err) {
			console.error(err);
		}
	});

	return prom;
}
/*Scroll to a specific section with smooth animation*/
function ui_click(name, optForce, optSubExpand) {
	var $content = $("#" + name + "content");
	var $header = $("#" + name + "header");
	$(".section").addClass("hidden");
	$content.removeClass("hidden");
	$header.removeClass("hidden")
	var p = $content.position();
	p.behavior = 'smooth';
	p.top = Math.max(p.top - 50, 0);
	window.scroll(p);
	if (optSubExpand !== undefined) {
		$(optSubExpand).children(".ans").removeClass("hidden");
	}
}

function displayAirTable() {
	var po = $("#td-airtable").position() ;
	po.behavior = 'smooth';
	po.top = Math.max(po.top + (window.outerHeight / 2) * .9, 0);
	$("#input-air_cap").focus();
	window.scroll(po);
}

/*Add input row fields to initial shareholders table*/
function ui_addshareholderclick() {
	var $d =  $("#list-shareholders table");
	var $w = $("<tr>"); 
	var $td = $("<th scope='row'>").text(shareholders).appendTo($w);
	$td = $("<td>").attr("id","td-address" + shareholders).appendTo($w);
	$("<input class='form-control' placeholder='Shareholder address'>").addClass("shareholder_account").attr("id","account"+shareholders).appendTo($td);

	$td = $("<td>").attr("id","td-count" + shareholders).appendTo($w);
	var $c = $("<input class='form-control' placeholder='Number of shares'>").addClass("shareholder_sharecount").attr("id","count"+shareholders).appendTo($td);

	$td = $("<td>").appendTo($w);
	$w.appendTo($d);
	addFormat($c[0]);
	/*On utilise shareholders pour placer un id unique à chaque case et les modifier plus tard*/
	shareholders++;
}

window.addEventListener('load', function() {
	if (window.web3 === undefined &&
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini|Mobile/i.test(navigator.userAgent)) {
		$("#mobile").removeClass("hidden");
	$("a.metamask").addClass("hidden");
	$(".metamasktext").hide();
}
})

function checkMetamask(img) {
	if(!web3.currentProvider.isMetaMask) {
		$("#imgmeta").attr("src", img);
		$("#modal-nometamask").modal("show");
		return false;
	}
}
$(document).ready(function() {
	initWeb3().then(setupEvents); 		//Reload of the contracts list at each page refresh
});

function setupEvents() {
	g_instance_manager.events.Register({fromBlock: 6019691}, watchRegisterEvent);
	function watchRegisterEvent(err, ev) {
		if (err !== null) {
			console.error(err);
			return;
		}
		var values = ev.returnValues;
		var row = {'nom' : values.name,'ID' : values.ID, 'index' : values.idx,'airContract' : values.airContract, 'equityContract' : values.equityContract, 'initShareholders' : values.shareholders, 'counts' : values.counts, 'setUpContract' : [], 'fundRaise' : [], 'investBSA' : [], 'investFund' : [], 'registerEq' :[]};
		g_data.companies[values.idx] = row;
		g_data.nameToIdx[values.name] = Number.parseInt(values.idx);

		var airContract = new web3.eth.Contract(g_aircontract_abi, values.airContract);
		var equityContract = new web3.eth.Contract(g_equity_token_abi, values.equityContract);
		airContract.events.allEvents({fromBlock: 6019691}, watchEvents);
		equityContract.events.allEvents({fromBlock: 6019691}, watchEvents);
	}

	function watchEvents(err, ev) {
		if(err) {
			console.error(err);
		}
		else{
			var values = ev.returnValues;
			var i;
			var company;
			if (values.corpName != undefined) { 
				company = g_data.companies[i = g_data.nameToIdx[values.corpName]];
			}
			if(ev.event == "setUpContract" || ev.event == "fundRaise" || ev.event == "registerEq") {
				company[ev.event] = values;
			}
			else if(ev.event == "investBSA" || ev.event == "investFund") {
				var l = company[ev.event].length;
				company[ev.event][l] = values;
			}
			if(i != undefined){
				fill_shareholders_table(i);
				set_company_status(i);
			}
		}
	}
	displayBalances();
}

/*Déduire l'état du contrat fermé/ouvert depuis nb de blocks restants avant expiration */
function set_company_status(i) { 
	$("#company" + i).remove();
	var $a = $("<a class='dropdown-item button2 nav-link nav-item'>").attr("onclick","ui_click('companyview');fill_shareholders_table("+ (i) + ")").text(g_data.companies[i].nom).attr("id","company" + i).appendTo($("#div-dropdown"));
	
	if(Object.keys(g_data.companies[i].setUpContract).length != 0 || Object.keys(g_data.companies[i].fundRaise).length != 0) {
		web3.eth.getBlockNumber( (err, block) => {
			if(err) {
				console.error(err); }
				else{
					var exp = g_data.companies[i].setUpContract.airExpiration - block;
					var fundExp = g_data.companies[i].fundRaise.expirationBlock - block;
					if(exp > 0 || fundExp > 0) {
						$("<label class='text-success right'>").text("OPEN").appendTo($a);
					} 
					else{
						$("<label class='text-danger right'>").text("CLOSED").appendTo($a);
					}
				} 
			});
	}
	else{
		$("<label class='text-danger right'>").text("CLOSED").appendTo($a);
	}	
}

function buildTxTable(table, res) {
	$(table).show();
	var $tr = $("<tr>").appendTo($(table));
	$("<td>").text(res.investor).appendTo($tr);
	var $td = $("<td>").text(res.amount).appendTo($tr).addClass("textcentre");
	addFormat($td[0]);
	$("<td>").text(res.block).appendTo($tr).addClass("textcentre");
}

/*Display pattern to build air contracts and fund raise parmaters tables
with inputs, placeholder and span (for unit symbol)*/
function displayTables(id, text, placeholder, span) {
	var $t = $("<td>").appendTo($("#" + id));
	$("<label>").text(text).appendTo($t);
	$t = $("<td>").attr("id","progress-"+id).appendTo($("#" + id));
	var $div = $("<div class='input-group-prepend'>").attr("id","div-"+id).appendTo($t);
	$("<span class='input-group-text'>").text(span).appendTo($div);
	var $i = $("<input>").attr("id","input-" + id).attr("placeholder",placeholder).appendTo($div);
	addFormat($i[0]);
}

/*Compute the simulation of AIR contract*/
function simulAIR() {
	var investBSA = AutoNumeric.getNumber(simulBSA);
	var decote = AutoNumeric.getNumber(simulDiscount);
	var cap = AutoNumeric.getNumber(simulCap);
	var floor = AutoNumeric.getNumber(simulFloor);
	var cur = AutoNumeric.getNumber(simulValo);
	var nbShares = AutoNumeric.getNumber(simulShares);
	var investFUND = AutoNumeric.getNumber(simulFund);

	var final = cur * (10000 - decote) / 10000;
	if(final > cap) {
		final = cap;
	}
	else if(final < floor){
		final = floor;
	}
	var shares_bsa = Math.round(investBSA * nbShares / final);
	var shares_fund = Math.round(investFUND * nbShares / cur);
	var total = parseFloat(nbShares) + parseFloat(shares_bsa) + parseFloat(shares_fund);

	var percent_founders = Math.round((nbShares / total) * 100);
	var percent_bsa = Math.round((shares_bsa / total) * 100);
	var percent_late = Math.round((shares_fund / total) * 100);

	$("#label-founder-shares").text(nbShares);
	$("#label-bsa-shares").text(shares_bsa);
	$("#label-fund-shares").text(shares_fund);

	$("#label-founder-percent").text(percent_founders + "%");
	$("#label-bsa-percent").text(percent_bsa + "%");
	$("#label-fund-percent").text(percent_late + "%");
}

/*Start fund raise and select final pre-money valuation to use to convert AIR tokens from investors*/
function chooseFinalValuation() {
	checkMetamask('fund.png');
	var idx = document.getElementById("div-dropdown").getAttribute("index");

	var airContract = new web3.eth.Contract(g_aircontract_abi, g_data.companies[idx].airContract);
	var dur = AutoNumeric.getNumber($("#input-fund-duration")[0]);;
	var cap = AutoNumeric.getNumber($("#input-fund-cap")[0]);
	var val = AutoNumeric.getNumber($("#input-fund-valo")[0]);
	airContract.methods.startFundRaise(val, dur * 6500, cap,g_data.companies[idx].nom).send({from : web3.eth.defaultAccount});

	var company = new web3.eth.Contract(g_equity_token_abi, g_data.companies[idx].equityContract);
	/*We add the air contract as a minter to allow it to mint shares in convert() function*/
	company.methods.addMinterContract(g_data.companies[idx].airContract).send({from : web3.eth.defaultAccount});
}

/*Build air contracts and fund raise parameters tables*/
function displayAirParameters(table, table2) {
	$(table).empty();
	$("<th colspan=3>").attr("id","air-title").text('No Air contract').appendTo($(table));
	$("<tr>").attr("id","air_cap").appendTo($(table));
	$("<tr>").attr("id","air_floor").appendTo($(table));
	$("<tr>").attr("id","air_discount").appendTo($(table));
	$("<tr>").attr("id","air_duration").appendTo($(table));
	$("<tr>").attr("id","air_bsacap").appendTo($(table));
	$("<th colspan=3>").text("Fund raise parameters").addClass("bg-dark text-light textcentre").appendTo($(table2));
	$("<tr>").attr("id","fund-valo").appendTo($(table2));
	$("<tr>").attr("id","fund-duration").appendTo($(table2));
	$("<tr>").attr("id","fund-cap").appendTo($(table2));
}

/*Modal to confirm and have a transaction feedback for investors (BSA/fund raise)*/
function displayModal(typeInvest) {
	if(checkMetamask('bsa.png') == false) {
		return;
	}
	if(typeInvest == 1) {
		$("#label-confirm-bsa").remove();
		$("#invest-bsa-button").attr("disabled",false);
		$("#exampleModal table").empty();
		var amount = $("#bsa-input").val();
	}
	else if(typeInvest == 2) {
		$("#label-confirm-fund").remove();
		$("#invest-fund-button").attr("disabled",false);
		$("#exampleModal2 table").empty();
		var amount = $("#fund-input").val();
	}

	var idx = document.getElementById("div-dropdown").getAttribute("index");
	var airContract = new web3.eth.Contract(g_aircontract_abi, g_data.companies[idx].airContract);

	/*Display company and AIR contract for BSA parameters*/
	if(typeInvest == 1 && Object.keys(g_data.companies[idx].setUpContract).length != 0) {
		$("<th colspan=2 class='textcentre'>").text(name).addClass("text-dark").appendTo($("#txTable1"));
		var $tr = $("<tr>").appendTo($("#txTable1"));
		$("<td class='large50'>").text("Registration number").appendTo($tr);
		$("<td class='textcentre'>").text($("#compID")[0].innerText).appendTo($tr);
		$tr = $("<tr>").appendTo($("#txTable1"));
		$("<td class='large50 '>").text("Floor valuation ").appendTo($tr);
		var $td = $("<td class='textcentre'>").text(g_data.companies[idx].setUpContract.valuationFloor).appendTo($tr);
		addFormatDol($td[0]);
		$tr = $("<tr>").appendTo($("#txTable1"));
		$("<td class='large50'>").text("Cap valuation ").appendTo($tr);
		$td = $("<td class='textcentre'>").text(g_data.companies[idx].setUpContract.valuationCap).appendTo($tr);
		addFormatDol($td[0]);
		$tr = $("<tr>").appendTo($("#txTable1"));
		$("<td class='large50'>").text("Discount ").appendTo($tr);
		$("<td class='textcentre'>").text((g_data.companies[idx].setUpContract.airDiscount /100) + "%").appendTo($tr);
		$tr = $("<tr>").attr("id","tr-levelbsa").appendTo($("#txTable1"));
		$("<td class='large50'>").text("Level of investment ").appendTo($tr);
		airContract.methods.getBSAInvestment().call((err, bsa) => {
			$("<td class='textcentre'>").text(bsa +"$ / " + g_data.companies[idx].setUpContract.investmentCap + "$").appendTo($("#tr-levelbsa"));
		});
		$("<th colspan=2 class='textcentre'>").text("Transaction status").addClass("text-dark").appendTo($("#txFeedback1"));
		$tr = $("<tr>").appendTo($("#txFeedback1"));
		$("<td>").text("Waiting for investor confirmation").attr("id","status-td1").appendTo($tr);
		$("#exampleModal").modal('show');
	}

	/*Display company and fund raise parameters*/
	if(typeInvest == 2 && Object.keys(g_data.companies[idx].fundRaise).length != 0) {
		$("<th colspan=2 class='textcentre'>").text(g_data.companies[idx].fundRaise.corpName).addClass("text-dark").appendTo($("#txTable2"));
		var $tr = $("<tr>").appendTo($("#txTable2"));
		$("<td class='large50'>").text("Registration number").appendTo($tr);
		$("<td class='textcentre'>").text($("#compID")[0].innerText).appendTo($tr);
		$tr = $("<tr>").appendTo($("#txTable2"));
		$("<td>").text("Pre-money valuation ").appendTo($tr);
		var $td = $("<td class='textcentre'>").text(g_data.companies[idx].fundRaise.premoneyValuation).appendTo($tr);
		addFormatDol($td[0]);
		$tr = $("<tr>").attr("id","tr-levelfund").appendTo($("#txTable2"));
		$("<td>").text("Level of investment").appendTo($tr);
		airContract.methods.getFundInvestment().call( (err, inv) => {
			$("<td class='textcentre'>").text(inv + "$ / " + g_data.companies[idx].fundRaise.cap + "$").appendTo($("#tr-levelfund"));
		})
		$tr = $("<tr>").attr("id","tr-nbshares").appendTo($("#txTable2"));
		$("<td>").text("Number of shares obtained").appendTo($tr);
		$("<th>").text("Transaction status").addClass("text-body").appendTo($("#txFeedback2"));
		$tr = $("<tr>").appendTo($("#txFeedback2"));
		$("<td>").text("Waiting for investor confirmation").attr("id","status-td2").appendTo($tr);
		$("#exampleModal2").modal('show');
	}
}

/*Confirmation message in invest modal with amount of investment*/
function displayConfirmation(type) {
	var idx = document.getElementById("div-dropdown").getAttribute("index");
	if(type == 1) {
		$("#validate-button").attr("disabled",false);
		$("#invest-bsa-button").attr("disabled",true);
		$("<h4>").text("Do you confirm investing " + $("#bsa-input").val() +" DAI ?").addClass("font-weight-bold").attr("id","label-confirm-bsa").appendTo($("#modal-body-confirm"));
	}
	else if(type == 2) {
		var $div = document.getElementById("div-dropdown").getAttribute("index");
		var airContract = new web3.eth.Contract(g_aircontract_abi, g_data.companies[idx].airContract);
		airContract.methods.getShareRequestFundRaise(AutoNumeric.getNumber($("#fund-input")[0])).call( (err, nb) => {
			$("<td class='textcentre'>").text(nb).appendTo($("#tr-nbshares"));
		});	
		$("#validate-button2").attr("disabled",false);
		$("#invest-fund-button").attr("disabled",true);
		$("<h4>").text("Do you confirm investing " + $("#fund-input").val() +" DAI ?").addClass("font-weight-bold").attr("id","label-confirm-fund").appendTo($("#modal-body-confirm2"));		
	}
}

function refillTable(text, text2, text3, table) {
	var $thead = $("<thead>").appendTo($(table));
	$("<th>").text(text).appendTo($thead);
	$("<th>").text(text2).appendTo($thead).addClass("textcentre");
	$("<th>").text(text3).appendTo($thead).addClass("textcentre");
}

function explainBsaParameters(text, text2, text3, text4, text5, id, id2, id3, id4, id5) {
	$("<td class='large50'>").text(text).appendTo($(id));
	$("<td class='large50'>").text(text2).appendTo($(id2));
	$("<td class='large50'>").text(text3).appendTo($(id3));
	$("<td class='large50'>").text(text4).appendTo($(id4));
	$("<td class='large50'>").text(text5).appendTo($(id5));
}

function buildCompanyResume(text, id) {
	var $tr = $("<tr>").appendTo($("#company-resume"));
	$("<h4>").text(text).appendTo($tr);
	if(id != "resume-valo") {
		$("<td colspan=2>").attr("id",id).appendTo($tr);
	}
	else{
		$("<td>").attr("id",id + "1").appendTo($tr);
		$("<td>").attr("id",id + "2").appendTo($tr);
	}
}

function buildProgressBar(id, text, idprog) {
	var $tr = $("<tr>").attr("id",id).appendTo($("#company-resume"));
	$("<h4>").text(text).appendTo($tr);
	var $td = $("<td colspan=2>").appendTo($tr);
	$("<div class='progress'>").attr("id",idprog).appendTo($td);
}

/* METAMASK NEEDED */
function displayBalances() {
	if(!web3.eth.defaultAccount) {
		return;
	}   				//Display DAI balance from cashToken balanceOf()
	g_instance_manager.methods.getToken().call( (err, tokenAddress) => {
		var token = new web3.eth.Contract(g_cashtoken_abi, tokenAddress);
		token.methods.balanceOf(web3.eth.defaultAccount).call((err, r) => {
			if(!err){
				if(r > 0){
					setValueAutonumeric($("#label-dai")[0],r); 
					$("#label-dai").removeClass("text-danger").addClass("text-success");
				}
				else{
					$("#label-dai").text("No DAI").removeClass("text-success").addClass("text-danger");
				}
			}
			else{
				console.error(err);
			}
		});
	});
}

function displaySharesRequest(airContract) {			//getShareRequest() retrieves the number of shares 
	airContract.methods.getShareRequestConversion(web3.eth.defaultAccount).call( (err, nb) => {	//an investor can request from his AIR tokens amount
		if(nb > 0){
			$("#convert-button").attr("disabled",false);
			$("#request-shares").removeClass("text-danger").addClass("text-success font-weight-bold").text("You can request " + nb + " shares by converting your AIR tokens.");
		}
		else{
			$("#convert-button").attr("disabled",true);
			$("#request-shares").removeClass("text-success").addClass("text-danger").text("You can not request any share.");
		}
	});
}

$("#dai-dropdown").click(function() {
	checkMetamask('balance.png');
})

function fill_shareholders_table(id) {
  $("#shareholders-table").empty();						//Emptying of each HTML element we do not want to duplicate 
  $("#initial-shareholders").empty();					//at the refresh or when we double click it 
  $("#txAir").hide();
  $("#txFund").hide();
  $("#txAir").empty();
  $("#txFund").empty();
  $("#startFund").empty();
  $("#divbutton").empty();
  $("#divbutton2").empty();
  $("#button-startfund").empty();
  $("#bsa-button").attr("disabled",true);
  $("#fund-button").attr("disabled",true);
  $("#fundraise-table").empty(); 
  $("#company-resume").empty();
  $("#request-shares").text("Fund raise closed, you can not yet convert your AIR tokens.");

  refillTable("Shareholder ", "Number of shares", "Number of tokens Air", "#shareholders-table");
  refillTable("Investor account", "Amount of investment", "# Block", "#txAir");
  refillTable("Investor account", "Amount of investment", "# Block", "#txFund");

  /*We build the main table resuming the company status with progress bars and display of its parameters*/
  $("<th colspan =3>").attr("id","resume-name").addClass("textcentre text-info").appendTo($("#company-resume"));
  buildCompanyResume("Registration number", "resume-id");
  buildCompanyResume("AIR status", "resume-air");
  buildCompanyResume("Fund raise status", "resume-fund");
  buildCompanyResume("Valuation", "resume-valo");

  buildProgressBar("inv_bsa", "BSA investments (DAI)", "prog_bsa");
  buildProgressBar("inv_fund", "Fund raise (DAI)", "prog_fund");
  buildCompanyResume("Contract address", "contractAd");
  /*Initiliaze by default the company resume table*/
  $("<h4 onclick='displayAirTable()' class='text-info'>").text("Click to start").attr("id","td-air").appendTo($("#resume-air"));
  $("<h4>").text("Closed").attr("id","td-fund").appendTo($("#resume-fund"));
  $("<h4>").text("N/A").attr("id","td-valo1").appendTo($("#resume-valo1"));
  $("<h4>").attr("id","td-valo2").appendTo($("#resume-valo2"));

  var $head = $("<thead>").appendTo($("#initial-shareholders"));
  $("<th>").text('Shareholders').appendTo($head);
  $("<th>").text('# Share count').appendTo($head);

  for(var n = 0; n < g_data.companies[id].initShareholders.length; n++) {				
  	var $tr =  $("<tr>").appendTo("#initial-shareholders");
  	$("<td>").text(g_data.companies[id].initShareholders[n]).appendTo($tr);
  	var $td = $("<td>").appendTo($tr);
  	addFormat($td[0]);
  	setValueAutonumeric($td[0], g_data.companies[id].counts[n]);
  }

  $("<h3>").text(g_data.companies[id].nom).appendTo($("#resume-name"));
  $("<h4>").text(g_data.companies[id].ID).attr("id","compID").appendTo($("#resume-id"));

  var airContract = new web3.eth.Contract(g_aircontract_abi, g_data.companies[id].airContract);
  $("<a class='text-info'>").text(g_data.companies[id].airContract.substring(0,15)+"..").attr("href","https://etherscan.io/address/"+g_data.companies[id].airContract).appendTo($("#contractAd"));
  var compContract = new web3.eth.Contract(g_equity_token_abi, g_data.companies[id].equityContract);
  document.getElementById("div-dropdown").setAttribute("index", id);

  if(Object.keys(g_data.companies[id].registerEq).length != 0) {
  	var holdersTab = new Set();
  	var l = g_data.companies[id].investBSA.length - 1;
  	if(l >= 0) {
  		for(var m = 0 ; m < g_data.companies[id].investBSA[l].aHolders.length; m++) {
  			holdersTab.add(g_data.companies[id].investBSA[l].aHolders[m]);
  		}
  	}
  	for(var j = 0; j < g_data.companies[id].registerEq.holders.length; j++) {
  		holdersTab.add(g_data.companies[id].registerEq.holders[j]);
  	}
  	holdersTab.forEach(displayShareTokens);
  }

  /*Fill the dynamic shareholders table, the initial plus the new investors (BSA/fund raise)*/
  function displayShareTokens(account) {
  	compContract.methods.balanceOf(account).call((err,shares) => {
  		var $tr = $("<tr>").appendTo($("#shareholders-table"));
  		$("<td>").text(account).appendTo($tr);
  		var $td = $("<td class='textcentre'>").appendTo($tr);
  		addFormat($td[0]);
  		setValueAutonumeric($td[0], shares);
  		airContract.methods.balanceOf(account).call((err,airTokens) => {
  			$td = $("<td class='textcentre'>").appendTo($tr);
  			addFormat($td[0]);
  			setValueAutonumeric($td[0], airTokens);
  		});
  	});	
  }

  displayAirParameters("#aircontracts-table", "#startFund");
  displayTables("air_cap" , "Pre-money Cap", "Enter cap valuation", "$");     	
  displayTables("air_floor" , "Pre-money Floor", "Enter floor valuation ", "$");
  displayTables("air_discount" , "Discount",  "Enter discount ", "%");
  displayTables("air_duration" , "Duration (Days)", "Enter duration ","#");
  displayTables("air_bsacap" , "AIR Investment Cap", "Enter the BSA cap","$");
  /*Explanations of each element in the AIR contract*/
  var pre_cap = "The pre money cap is the maximum valuation that might be applied for the conversion of the AIR tokens, this parameter protects the investor.";
  var pre_floor = "The pre money floor is the minimum valuation and is a security for the equity.";
  var txt_discount = "The discount is a percentage that is applied to the final pre-money valuation, it rewards the investor risk.";
  var txt_duration = "The duration is the limit of time for the BSA investment period before a possible fund raise. It is computed in days, the decimals are accepted with the point notation (ex : 1.2). ";
  var txt_cap = "The cap investment is a parameter to protect the shares dilution and keep a percentage of ownership safe and intact.";

  explainBsaParameters(pre_cap, pre_floor, txt_discount, txt_duration, txt_cap, "#air_cap", "#air_floor", "#air_discount", "#air_duration", "#air_bsacap" );
  /*Table to start the fund raise*/
  displayTables("fund-valo" , "Current valuation", 0 ,"$");
  $("<td class='large50'>").text("Enter here the current pre-money valuation after the BSA period and at the moment you want to start the fund raise.").appendTo($("#fund-valo"));
  displayTables("fund-duration" , "Duration (Days)",  0 ,"#");
  $("<td class='large50'>").text("Enter here the duration of the fund raise period, if it not stopped by the cap investment.").appendTo($("#fund-duration"));
  displayTables("fund-cap" , "Fund raise cap", 0 ,"$");
  $("<td class='large50'>").text("The fund cap is the maximum amount that can be invested i the fund raise, you can protect a certain ownership percentage of your own shares with this parameter.").appendTo($("#fund-cap"));

  $("#air-title").text("No AIR contract initialized ").addClass("textcentre bg-dark text-light");
  $("<div class='text-center' id='divbutton'>").appendTo($("#td-airtable"));
  $("<button class='btn btn-primary active' onclick='startAIR()' id='button-startair'>").text('START AIR CONTRACT').appendTo($("#divbutton"));
  $("<button class='btn btn-success active' onclick='chooseFinalValuation()' id='button-choosevaluation' disabled>").text("START FUND RAISE").appendTo($("#button-startfund"));

  if(Object.keys(g_data.companies[id].setUpContract).length != 0 || Object.keys(g_data.companies[id].fundRaise).length != 0 || g_data.companies[id].investBSA.length > 0 || g_data.companies[id].investFund.length > 0) {

  	$("#button-startair").remove();
  	$("#button-choosevaluation").attr("disabled",false);

  	if(Object.keys(g_data.companies[id].setUpContract).length != 0) {
  		$("#td-air").removeClass("text-info").text("Open for investments");
  		$("#td-fund").text("Air in progress");
  		var $t = $("#td-valo1").text(g_data.companies[id].setUpContract.valuationFloor);
  		addFormatDol($t[0]);
  		$("#td-valo2").text("(AIR floor)");
  		$("#bsa-button").attr("disabled",false);
  		$("#air-title").text("AIR contract - Open to BSA");
  		/*Display of the contract parameters by putting the input in readonly*/
  		setValueAutonumeric($("#input-air_cap")[0],g_data.companies[id].setUpContract.valuationCap);
  		setValueAutonumeric($("#input-air_floor")[0],g_data.companies[id].setUpContract.valuationFloor);
  		setValueAutonumeric($("#input-air_discount")[0],g_data.companies[id].setUpContract.airDiscount/ 100);
  		var dura = Math.round(g_data.companies[id].setUpContract.airDuration / 6500);
  		setValueAutonumeric($("#input-air_duration")[0],dura);
  		setValueAutonumeric($("#input-air_bsacap")[0],g_data.companies[id].setUpContract.investmentCap);
  		/*Display of the investment level of BSA with progress bar in company resume*/
  		airContract.methods.getBSAInvestment().call( 
  			(err, res) => {
  				var pourcentage = (res * 100) / AutoNumeric.getNumber($("#input-air_bsacap")[0]);
  				var $div = $("<div class='progress-bar bg-success' role='progressbar' aria-valuemin='0' aria-valuemax='100'> ").attr("style","width:"+pourcentage+"%").attr("aria-valuenow",pourcentage).appendTo($("#prog_bsa"));
  				$div.text(res + "/" + $("#input-air_bsacap").val()).addClass("textProgress text-dark");
  			});
  	}

  	if(Object.keys(g_data.companies[id].fundRaise).length != 0) {
  		console.log("fund raise");
  		var premoney = g_data.companies[id].fundRaise.premoneyValuation;
  		$("#td-air").removeClass("text-info").text("Closed");
  		$("#td-fund").text("Open for investments");
  		var $t = $("#td-valo1").text(premoney);
  		addFormatDol($t[0]);
  		$("#td-valo2").text("(Current pre-money)");
  		$("#air-title").text("AIR contract - Closed");
  		$("#bsa-button").attr("disabled",true);
  		$("#fund-button").attr("disabled",false);
  		$("#input-inv_valuation").attr('value', premoney);

  		displaySharesRequest(airContract);
  		var dura = Math.round(g_data.companies[id].fundRaise.fundDuration / 6500);
  		var $i = $("#input-fund-duration").attr("value",dura).attr("readonly",true);
  		addFormat($i[0]);
  		$i = $("#input-fund-cap").attr("value",g_data.companies[id].fundRaise.cap).attr("readonly",true);
  		addFormat($i[0]);
  		$i = $("#input-fund-valo").attr("value",g_data.companies[id].fundRaise.premoneyValuation).attr("readonly",true);
  		addFormat($i[0]);
  		$("#button-choosevaluation").remove();
  		$("#button-convert").attr("disabled",false);

  		airContract.methods.getFundInvestment().call(( e, invest2) => {
  			var pourcentage2 = (invest2 * 100) / g_data.companies[id].fundRaise.cap;
  			var $div2 = $("<div class='progress-bar bg-success' role='progressbar' aria-valuemin='0' aria-valuemax='100'> ").attr("style","width:"+pourcentage2+"%").attr("aria-valuenow",pourcentage2).appendTo($("#prog_fund"));
  			$div2.text(invest2 + "/" + g_data.companies[id].fundRaise.cap).addClass("textProgress text-dark");
  		});
  	}
  	for(var i=0; i < g_data.companies[id].investBSA.length; i++) {
  		buildTxTable("#txAir",g_data.companies[id].investBSA[i]);
  	}
  	for(var i=0; i < g_data.companies[id].investFund.length; i++) {
  		buildTxTable("#txFund",g_data.companies[id].investFund[i]);
  	}
  }
}


/*Mint DAI if investor has an empty balance*/
function getNewDai(type) {
	checkMetamask();
	$("#modalDAI table").empty();
	$("#dai-msg").empty();
	var $tr = $("<tr>").appendTo($("#tableStatusTx"));
	var $td = $("<td>").text("Transaction loading in blockchain ...").attr("id","mint-status").appendTo($tr);
	$tr = $("<tr>").appendTo($("#tableStatusTx"));
	$td = $("<td>").text("Contract minting DAI").appendTo($tr);
	g_instance_manager.methods.getDAI(10000000).send( {from: web3.eth.defaultAccount}, (err,res) => {
		if(err) {
			$("<img src='wrong.png' class='right'>").appendTo($td);
			$("#mint-status").text("Transaction rejected, error in mintage.");
		}
		else{
			$("<img src='check.png' class='right'>").appendTo($td);
			$("#mint-status").text("Transaction completed !").addClass("text-success");
		}
	});
}

/*Call smart contract functions to invest by BSA from AIR contract*/
function investAir() {
	$("#label-confirm-bsa").remove();
	$("#validate-button").attr("disabled",true);
	$("#status-td1").removeClass("text-success").text("Transaction loading in blockchain ...");

	var $tr = $("<tr>").appendTo($("#txFeedback1"));
	$("<td>").text("DAI transfer").attr("id","dai-transfer1").appendTo($tr);
	var amount = AutoNumeric.getNumber($("#bsa-input")[0]);
	var idx = document.getElementById("div-dropdown").getAttribute("index");

	var airContract = new web3.eth.Contract(g_aircontract_abi, g_data.companies[idx].airContract);

	airContract.methods.getToken().call( (err, tokenAddress) => {
		var token = new web3.eth.Contract(g_cashtoken_abi, tokenAddress);
		token.methods.addMinter(g_instance_manager._address).call({from : web3.eth.defaultAccount}, (err,r) => {
			if (!err) {
				console.log("mint manager");
				token.methods.approve(airContract._address, amount).send({from : web3.eth.defaultAccount}, (err,r) => {
					if (err) {
						$("#status-td1").text("Transaction rejected, DAI transfer not approved.");
						$("<img src='wrong.png' class='right'>").appendTo($("#dai-transfer1"));
					}

			//Give feedback on each callback function of transaction to explain if reject of Tx
			else{
				$("<img src='check.png' class='right'>").appendTo($("#dai-transfer1"));
				var $tr = $("<tr>").appendTo($("#txFeedback1"));
				$("<td>").text("BSA investment").attr("id","bsainvest").appendTo($tr);
				airContract.methods.invest(amount, g_data.companies[idx].nom).send({from : web3.eth.defaultAccount}, ( err, res) => {
					if(err){
						$("<img src='wrong.png' class='right'>").appendTo($("#bsainvest"));
						$("#status-td1").text("Transaction rejected, error in BSA investment or insufficient DAI amount.");
					}
					else{
						$("<img src='check.png' class='right'>").appendTo($("#bsainvest"));
						$("#status-td1").text("Transaction completed ! ").addClass("text-success");
					}
				})
			}
		});    
			}
			else{
				console.log("pb mint");
			}
		});
	});
}

/*Call contract functions to invest by fund raise*/
function fundRaise() {
	checkMetamask();
	$("#label-confirm-fund").remove();
	$("#validate-button2").attr("disabled",true);
	$("#status-td2").removeClass("text-success").text("Transaction loading in blockchain ...");
	var $tr = $("<tr>").appendTo($("#txFeedback2"));
	$("<td>").text("DAI transfer").attr("id","dai-transfer2").appendTo($tr);
	var amount = AutoNumeric.getNumber($("#fund-input")[0]);
	var idx = document.getElementById("div-dropdown").getAttribute("index");
	var airContract = new web3.eth.Contract(g_aircontract_abi, g_data.companies[idx].airContract); 

	airContract.methods.getToken().call( (err, tokenAddress) => {
		var token = new web3.eth.Contract(g_cashtoken_abi, tokenAddress);

		token.methods.approve(airContract._address, amount).send({from : web3.eth.defaultAccount}, (err,r) => {
			if (err) {
				$("#status-td2").text("Transaction rejected, DAI transfer not approved.");
				$("<img src='wrong.png' class='right'>").appendTo($("#dai-transfer2"));
			}
			else{
				$("<img src='check.png' class='right'>").appendTo($("#dai-transfer2"));

				$tr = $("<tr>").appendTo($("#txFeedback2"));
				$("<td>").text("Fund raise").attr("id","investfund").appendTo($tr);
				airContract.methods.investFundRaise(amount, g_data.companies[idx].nom).send({from : web3.eth.defaultAccount}, ( err, res) => {
					if(err) {
						$("<img src='wrong.png' class='right'>").appendTo($("#investfund"));
						$("#status-td2").text("Transaction rejected, error in fund raise or insufficient DAI amount.");
					}
					else{
						$("<img src='check.png' class='right'>").appendTo($("#investfund"));
						$("#status-td2").addClass("text-success").text("Transaction completed !");
					}
				});
			}
		});
	});
}

/*Display parameters of conversion in convert modal for investor feedback (pre-money valuation, balance of AIR tokens, number of shares he can request*/
function setupConversion() {
	checkMetamask();
	$("#tableConversion").empty();
	$("#txConvertFeedback").empty();
	var idx = document.getElementById("div-dropdown").getAttribute("index");

	$("<th colspan=2 class='textcentre'>").text(g_data.companies[idx].nom).appendTo("#tableConversion");
	$("<th class='textcentre'>").text("Transaction status").appendTo("#txConvertFeedback");
	var $tr = $("<tr>").appendTo($("#txConvertFeedback"));
	$("<td>").text("Waiting for AIR tokens holder to confirm").attr("id","status-convert").appendTo($tr);

	var airContract = new web3.eth.Contract(g_aircontract_abi, g_data.companies[idx].airContract); 
	var $tr = $("<tr>").appendTo($("#tableConversion"));
	$("<td>").text("Pre-money valuation").appendTo($tr);
	var $td = $("<td>").text(g_data.companies[idx].fundRaise.premoneyValuation).appendTo($tr);
	addFormatDol($td[0]);

	airContract.methods.balanceOf(web3.eth.defaultAccount).call( (err, bal) => {
		var $tr = $("<tr>").appendTo($("#tableConversion"));
		$("<td>").text("AIR tokens").appendTo($tr);
		var $td = $("<td>").text(bal).appendTo($tr);
		addFormat($td[0]);

		airContract.methods.getShareRequestConversion(web3.eth.defaultAccount).call( (err, res) => {
			var $tr = $("<tr>").appendTo($("#tableConversion"));
			$("<td>").text("Shares after conversion").appendTo($tr);
			var $td = $("<td>").text(res).appendTo($tr);
			addFormat($td[0]);
			$("#modal-convert-confirm").text("Do you want to convert your " + bal + " AIR tokens into " + res + " shares ? ").addClass("font-weight-bold");
		});
	});
	$("#convertModal").modal('show');
}

/*Modal feedback for convert transaction*/
function convertAir() {
	checkMetamask();
	$("#status-convert").text("Transaction loading in blockchain ...");
	var $tr = $("<tr>").appendTo($("#txConvertFeedback"));
	$("<td>").text("Conversion of AIR tokens").attr("id","td-convert").appendTo($tr);

	var idx = document.getElementById("div-dropdown").getAttribute("index");
	var airContract = new web3.eth.Contract(g_aircontract_abi, g_data.companies[idx].airContract); 
	airContract.methods.convertNewTokenAction().send({from : web3.eth.defaultAccount}, (err, res) => {
		if(err) {
			$("<img src='wrong.png' class='right'>").appendTo($("#td-convert"));
			$("#status-convert").text("Conversion rejected.");
		}
		else{
			$("<img src='check.png' class='right'>").appendTo($("#td-convert"));
			$("#status-convert").text("Conversion done !").addClass("text-success");
			$("#convert-button").attr("disabled",true);
		}
	});
}

/*Start the AIR contract, retrieving of input and parameters and call of smart contract functions*/
function startAIR() {
	checkMetamask();
	var idx = document.getElementById("div-dropdown").getAttribute("index");
	var airContract = new web3.eth.Contract(g_aircontract_abi, g_data.companies[idx].airContract); 
	var cap = AutoNumeric.getNumber($("#input-air_cap")[0]);
	var floor = AutoNumeric.getNumber($("#input-air_floor")[0]);
	var discount = AutoNumeric.getNumber($("#input-air_discount")[0]) * 100;
	var duration = AutoNumeric.getNumber($("#input-air_duration")[0]) * 6500;
	duration = Math.round(duration);
	console.log("duration : " + duration);
	var max = AutoNumeric.getNumber($("#input-air_bsacap")[0]);
	airContract.methods.setupAIR( cap, floor, discount, duration, max, g_data.companies[idx].nom).send({from : web3.eth.defaultAccount});
}

/*Register a company, check on inputs fields (valid or not) and retrieve list of initial shareholders and share counts*/
function registerCompany() {
	checkMetamask();

	var any_error = false;
	/*Regex checks on input fields*/
	function check_address(txtAddress) {
		try{
			return /^0x[0-9a-fA-F]{40}$/.test(txtAddress.trim());
		} catch(err){
			return false;
		}
	}
	function check_sharecount(txt) {
		try {
			return /^\d*($|(\.|,| )\d+)$/.test(txt) && Number.parseFloat(txt.replace(",", ".")) > 0; 
		} catch(err) {
			return false;
		}
	}
	function check_registrationID(registrationID) {
		try{
			return /^[0-9]{9}$/.test(registrationID.trim());
		} catch(err){
			return false;
		}
	}
	/*Retrieve the list of shareholders address from the tr elements of array*/
	var addressShareHolders = $("#list-shareholders.inputgroup table tr input.shareholder_account").map((i, x) => {
		var txtAddress = $(x).val();
		$("#div-feedback-address" + i).remove();
		if(!check_address(txtAddress)) {		
			$("#account" + (i + 1)).addClass("form-control is-invalid");
			var $div = $("<div class='invalid-feedback' style='font-size:15'>").attr("id","div-feedback-address" + i).text("Invalid address").appendTo($("#td-address" + (i + 1)));
			any_error = true;
		}
		else{
			$("#account" + (i + 1)).addClass("form-control is-valid").removeClass("is-invalid");}
			return txtAddress;
		}).toArray()
	/*Retrieve list of share counts matching shareholders addresses*/
	var countShareHolders = $("#list-shareholders.inputgroup table tr input.shareholder_sharecount").map( (i, x) => {
		var txt = $(x).val();
		$("#div-feedback-count" + i).remove();
		if (!check_sharecount(txt)) {
			$("#count" + ( i + 1)).addClass("form-control is-invalid");
			var $div = $("<div class='invalid-feedback' style='font-size:15'>").attr("id","div-feedback-count" + i).text("Invalid share count").appendTo($("#td-count" + (i + 1)));
			any_error = true;
		}
		else{
			$("#count" + ( i + 1)).addClass("form-control is-valid").removeClass("is-invalid");}
			return AutoNumeric.getNumber($(x)[0]);
		}).toArray()

	var companyID = $("#company-ID").val();
	$("#div-feedbackID").remove();
	if (!check_registrationID(companyID)) {
		$("#company-ID").addClass("form-control is-invalid");
		var $div = $("<div id='div-feedbackID' class='invalid-feedback' style='font-size:15'>").text("Invalid registration ID").appendTo($("#div-companyID"));
		any_error = true;
	}
	else{$("#company-ID").addClass("form-control is-valid").removeClass("is-invalid");}
	/*If one of the regex check function returns an error, then we display the error messages on the wrong input and we exit the function*/
	if(any_error){return ;}
	var companyName = $("#company-name").val();

	g_instance_manager.methods.registerCompany(companyID, companyName, addressShareHolders, countShareHolders).send({from : web3.eth.defaultAccount});
}


