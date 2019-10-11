var g_instance_manager, g_equity_token_abi, g_aircontract_abi, g_cashtoken_abi;
var g_contract = "0x01f8717cd25aE1f7fc4F135FA45ec1557c3430CC";
var g_data = { nameToIdx : {}, companies: [] };
var names = ['Jacob Smith', 'Michael Johnson', 'Matthew Williams', 'Daniel Brown', 'John Miller', 'Emma Johnes', 'Hannah Carter', 'Emily Davis', 'Eric Rodriguez', 'Gabriel Wilson', 'Robert Thomas', 'Jennifer Roberts', 'Chloe Walsh', 'Sean Lee'];
var months = ['January', 'February', 'March', 'April','May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var map = [];


function setValueAutonumeric(input, value) {
	$(function() {
		AutoNumeric.set(input, value);
	})
}

const thousandSepDollar = {
	digitGroupSeparator : ' ',
	decimalPlaces : 0,
	currencySymbol : "$",
}

const thousandSep = {
	digitGroupSeparator : ' ',
	decimalPlaces : 0,
}

function addFormatDol(id) {
	$(function() {
		new AutoNumeric(id, thousandSepDollar);
	})
}
function addFormat(id) {
	$(function() {
		new AutoNumeric(id, thousandSep);
	})
}

async function initWeb3()
{
	/*Web Socket Infura pour Ropsten*/
	window.web3 = new Web3(new Web3.providers.WebsocketProvider('wss://ropsten.infura.io/ws'));
	var prom = new Promise( (resolve, reject) => {
		if (web3.currentProvider.connected) {
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

$(document).ready(function () {
	initWeb3().then(setupEvents);
});

$("#select-companies").change(function() {
	fillTables(this.value);
	$("#main").removeClass("hidden");
})

function setupEvents() {
	g_instance_manager.events.Register({fromBlock: 6019691}, watchRegisterEvent);
	function watchRegisterEvent(err, ev) {
		if (err !== null) {
			console.error(err);
			return;
		}
		var values = ev.returnValues;
		$("<option class='bold'>").text(values.name).attr("value", values.idx).appendTo($("#select-companies"));
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
			else if(ev.event == "investBSA" || ev.event == "investFund" || ev.event == "conversion") {
				var l = company[ev.event].length;
				company[ev.event][l] = values;
			}
		}
	}
}
function fillColumn(type, total) {
	for(var i = 0; i < $("#hist-updated-shareholders ." + type).length; i++) {
		$("#" + type + i).hide();
		if(total != 0) {
			$("<td class='tdpercent'>").text(Math.round((parseInt($("#" + type + i)[0].innerText, 10) / total) * 100) + "%").appendTo($("#tr" + i));
		}
		else{
			$("<td class='tdpercent'>").text("0%").appendTo($("#tr" + i));
		}
	}
}

function percentages() {
	var totalShares = 0;
	var totalTokens = 0;
	var totalConvert = 0;
	$("#hist-updated-shareholders .shares").toArray().forEach(function(el) { totalShares += parseInt(el.innerText, 10);});
	$("#hist-updated-shareholders .tokens").toArray().forEach(function(el) { totalTokens += parseInt(el.innerText, 10);});
	$("#hist-updated-shareholders .convert").toArray().forEach(function(el) { totalConvert += parseInt(el.innerText, 10);});
	fillColumn("shares", totalShares);
	fillColumn("tokens", totalTokens);
	fillColumn("convert", totalConvert);
	$("#percent").addClass("btn-success btn-sm").removeClass("btn-primary").text("Get #").attr("onclick", "getNumbers()");
}
function getNumbers() {
	$(".tdpercent").remove();
	$(".shares").show();
	$(".tokens").show();
	$(".convert").show();
	$("#percent").addClass("btn-primary").removeClass("btn-success").text("Get %").attr("onclick", "percentages()");
}

function initNames(i) {
	map = [];
	for(var j = 0; j < g_data.companies[i].initShareholders.length ; j++) {
		map[g_data.companies[i].initShareholders[j]] = names[j];
	}
	var s = g_data.companies[i].initShareholders.length;
	for(var l = 0; l < g_data.companies[i].investBSA.length; l++) {
		if(!map.includes(g_data.companies[i].investBSA[l])){
			map[g_data.companies[i].investBSA[l].investor] = names[s + l];
		}
	}
	var m = g_data.companies[i].investBSA.length;
	for(var l = 0; l < g_data.companies[i].investFund.length; l++) {
		if(!map.includes(g_data.companies[i].investFund[l])){
			map[g_data.companies[i].investFund[l].investor] = names[s + m + l];
		}
	}
}

function setTimestamp($tr, i , j, method) {
	web3.eth.getBlock(g_data.companies[i][method][j].block, (err, res) => {
		if(err) {
			console.log(err);
		}
		else{
			var date = new Date(res.timestamp * 1000);
			console.log(g_data.companies[i][method][j].block);
			var format = date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear();
			
			var $td = $("<td>").text(format).appendTo($tr);
			var $a = $("<a>").attr("href", "https://ropsten.etherscan.io/block/" + g_data.companies[i][method][j].block).text(" (#" + g_data.companies[i][method][j].block.substring(0, 10) + ")").appendTo($td);
			$td = $("<td>").text(map[g_data.companies[i][method][j].investor]).appendTo($tr);
			$("<a>").attr("href", "https://ropsten.etherscan.io/address/" + g_data.companies[i][method][j].investor).text(" (" + g_data.companies[i][method][j].investor.substring(0, 10) + "...)" ).appendTo($td);
			$td = $("<td>").text( g_data.companies[i][method][j].amount).appendTo($tr);	
			addFormatDol($td[0]);
		}
	});
}

function fillTables(i) {
	initNames(i);
	$("#company-title").text("Displaying AIR contract of " + g_data.companies[i].nom);
	document.getElementById("select-companies").setAttribute("idx", i);
	$("#investment-levels").empty();
	/*Initial shareholders*/
	$("#table-init-shareholders").empty();
	var $thead = $("<thead class='thead-dark'>").appendTo($("#table-init-shareholders"));
	$("<th>").text("Shareholder").appendTo($thead);
	$("<th style='text-align: center;' class='thead-dark'>").text("# Share count").appendTo($thead);
	for(var j = 0; j < g_data.companies[i].initShareholders.length ; j++) {
		var $tr = $("<tr>").appendTo($("#table-init-shareholders"));
		var $td = $("<td>").text(map[g_data.companies[i].initShareholders[j]]).appendTo($tr);
		$("<a>").attr("href", "https://ropsten.etherscan.io/address/" + g_data.companies[i].initShareholders[j]).text(" (" + g_data.companies[i].initShareholders[j].substring(0, 10) + "...)" ).appendTo($td);
		var $td = $("<td style='text-align: center;'>").text(g_data.companies[i].counts[j]).appendTo($tr);
		addFormat($td[0]);
	}

	/*AIR contract parameters*/
	$("#param-air").empty();
	$("#hist-tx-air").empty();
	if(Object.keys(g_data.companies[i].setUpContract).length != 0) {
		web3.eth.getBlockNumber( (err, block) => {
			if(!err) {
				var exp = g_data.companies[i].setUpContract.airExpiration - block;
				var fundExp = g_data.companies[i].fundRaise.expirationBlock - block;
				if(exp > 0 || fundExp > 0) {
					var $the = $("<thead class='thead-dark' style='text-align : center;'>").appendTo($("#param-air"));
					$("<th colspan=2>").text("AIR Contract - OPEN").appendTo($the);
				} 
				else{
					var $the = $("<thead class='thead-dark' style='text-align : center;'>").appendTo($("#param-air"));
					$("<th colspan=2>").text("AIR Contract - CLOSED").appendTo($the);
				}
			} 
		});
		var totalInvestBSA = 0;
		g_data.companies[i].investBSA.forEach(function(item, idx) {totalInvestBSA += parseInt(item.amount,10);}); 
		var level = totalInvestBSA * 100 / g_data.companies[i].setUpContract.investmentCap;
		
		$("<label class='bold'>").text("Niveau d'investissement par BSA : " + totalInvestBSA + "$ / " + g_data.companies[i].setUpContract.investmentCap + "$").appendTo($("#investment-levels"));
		var $prog = $("<div class='progress'>").appendTo($("#investment-levels"));
		$("<div class='progress-bar' role='progressbar' aria-valuemin = '0' aria-valuemax ='100'>").attr("style","width : " + level +"%;").appendTo($prog);


		var $tr = $("<tr>").appendTo($("#param-air"));
		var $td = $("<td style='width : 70%;' class='bold'>").text("Pre-money cap").appendTo($tr);
		$("<p style='font-weight : normal;'>").text("The pre money cap is the maximum valuation that might be applied for the conversion of the AIR tokens, this parameter protects the investor.").appendTo($td);
		$td = $("<td style='width : 30%;text-align: center;' class='bold'>").text(g_data.companies[i].setUpContract.valuationCap).appendTo($tr);
		addFormatDol($td[0]);
		var $tr = $("<tr>").appendTo($("#param-air"));
		$td = $("<td style='width : 70%;' class='bold'>").text("Pre-money floor").appendTo($tr);
		$("<p style='font-weight : normal;'>").text(" The pre money floor is the minimum valuation and is a security for the equity.").appendTo($td);
		$td = $("<td style='width : 30%;text-align: center;' class='bold'>").text(g_data.companies[i].setUpContract.valuationFloor).appendTo($tr);
		addFormatDol($td[0]);
		var $tr = $("<tr>").appendTo($("#param-air"));
		$td = $("<td style='width : 70%;' class='bold'>").text("Discount").appendTo($tr);
		$("<p style='font-weight : normal;'>").text("The discount is a percentage that is applied to the final pre-money valuation, it rewards the investor risk.").appendTo($td);
		$("<td style='width : 30%;text-align: center;' class='bold'>").text(Math.round(g_data.companies[i].setUpContract.airDiscount / 100) + "%").appendTo($tr);
		var $tr = $("<tr>").appendTo($("#param-air"));
		$td = $("<td style='width : 70%;' class='bold'>").text("Duration (days)").appendTo($tr);
		$("<p style='font-weight : normal;'>").text("The duration is the limit of time for the BSA investment period before a possible fund raise.").appendTo($td);
		$("<td style='width : 30%;text-align: center;' class='bold'>").text(Math.round(g_data.companies[i].setUpContract.airDuration / 6500) + " days").appendTo($tr);
		var $tr = $("<tr>").appendTo($("#param-air"));
		$td = $("<td style='width : 70%;' class='bold'>").text("AIR investment cap").appendTo($tr);
		$("<p style='font-weight : normal;'>").text("The cap investment is a parameter to protect the shares dilution and keep a percentage of ownership safe and intact.").appendTo($td);
		$td = $("<td style='width : 30%;text-align: center;' class='bold'>").text(g_data.companies[i].setUpContract.investmentCap).appendTo($tr);
		addFormatDol($td[0]);
	}
	else{
		$("<th colspan=2>").text("AIR Contract - Not initialized").appendTo($("<thead class='thead-dark' style='text-align : center;'>").appendTo($("#param-air")));
	}
	/*Historique BSA tx*/
	var $thead = $("<thead class='thead-dark'>").appendTo($("#hist-tx-air"));
	$("<th>").text("Timestamp of block #").appendTo($thead);
	$("<th>").text("Investor").appendTo($thead);
	$("<th>").text("Amount of investment").appendTo($thead);
	
	for(var j = 0 ; j < g_data.companies[i].investBSA.length; j++){
		var $tr = $("<tr>").appendTo($("#hist-tx-air"));
		setTimestamp($tr, i, j, 'investBSA');	
	}
	if(g_data.companies[i].investBSA.length == 0){
		$("<td colspan=3>").text("No BSA transaction yet").appendTo($("<tr>").appendTo($("#hist-tx-air")));
	}

	/*Parameters fund raise*/
	$("#hist-tx-fund").empty();
	$("#param-fundraise").empty();
	if(Object.keys(g_data.companies[i].fundRaise).length != 0) {
		var totalInvestFund = 0;
		g_data.companies[i].investFund.forEach(function(item, idx) {totalInvestFund += parseInt(item.amount,10);}); 
		var level = totalInvestFund * 100 / g_data.companies[i].fundRaise.cap;

		$("<label class='bold'>").text("Niveau d'investissement par fund raise : " + totalInvestFund + "$ / " + g_data.companies[i].fundRaise.cap + "$").appendTo($("#investment-levels"));
		var $prog = $("<div class='progress'>").appendTo($("#investment-levels"));
		$("<div class='progress-bar' role='progressbar' aria-valuemin = '0' aria-valuemax ='100'>").attr("style","width : " + level +"%;").appendTo($prog);


		var $thead = $("<thead class='thead-dark' colspan =2>").appendTo($("#param-fundraise"));
		$("<th colspan=2>").text("Fund raise parameters").appendTo($thead);
		var $tr = $("<tr>").appendTo($("#param-fundraise"));
		var $td = $("<td style='width : 70%;' class='bold'>").text("Current valuation").appendTo($tr);
		$("<p style='font-weight : normal;'>").text("Here is the current pre-money valuation after the BSA period and at the moment you want to start the fund raise.").appendTo($td);
		$td = $("<td style='width : 30%;text-align: center;' class='bold'>").text(g_data.companies[i].fundRaise.premoneyValuation).appendTo($tr);
		addFormatDol($td[0]);
		var $tr = $("<tr>").appendTo($("#param-fundraise"));
		$td = $("<td style='width : 70%;' class='bold'>").text("Duration (days)").appendTo($tr);
		$("<p style='font-weight : normal;'>").text("This parameter sets the duration of the fund raise period, if it not stopped by the cap investment.").appendTo($td);
		$("<td style='width : 30%;text-align: center;' class='bold'>").text(Math.round(g_data.companies[i].fundRaise.fundDuration / 6500) + " days").appendTo($tr);
		var $tr = $("<tr>").appendTo($("#param-fundraise"));
		$td = $("<td style='width : 70%;' class='bold'>").text("Fund raise cap").appendTo($tr);
		$("<p style='font-weight : normal;'>").text("The fund cap is the maximum amount that can be invested i the fund raise, you can protect a certain ownership percentage of your own shares with this parameter.").appendTo($td);
		$td = $("<td style='width : 30%;text-align: center;' class='bold'>").text(g_data.companies[i].fundRaise.cap).appendTo($tr);
		addFormatDol($td[0]);
	}
	else{
		$("<th colspan=2>").text("Fund raise not initialized").appendTo( $("<thead class='thead-dark' colspan =2>").appendTo($("#param-fundraise")));

	}
	/*Historique fund tx*/
	var $thead = $("<thead class='thead-dark'>").appendTo($("#hist-tx-fund"));
	$("<th>").text("Timestamp of block #").appendTo($thead);
	$("<th>").text("Investor account").appendTo($thead);
	$("<th>").text("Amount of investment").appendTo($thead);
	for(var j = 0 ; j < g_data.companies[i].investFund.length; j++){
		var $tr = $("<tr>").appendTo($("#hist-tx-fund"));
		setTimestamp($tr, i, j, 'investFund');
	}
	if(g_data.companies[i].investFund.length == 0) {
		$("<td colspan=3>").text("No fund raise transaction yet").appendTo($("<tr>").appendTo($("#hist-tx-fund")));
	}

	/*Updated shareholders table*/
	var holdersTab = new Set();
	var l = g_data.companies[i].investBSA.length - 1;
	if(l >= 0) {
		for(var m = 0 ; m < g_data.companies[i].investBSA[l].aHolders.length; m++) {
			holdersTab.add(g_data.companies[i].investBSA[l].aHolders[m]);
		}
	}
	for(var j = 0; j < g_data.companies[i].registerEq.holders.length; j++) {
		holdersTab.add(g_data.companies[i].registerEq.holders[j]);
	}
	/*Fill the dynamic shareholders table, the initial plus the new investors (BSA/fund raise)*/
	$("#hist-updated-shareholders").empty();
	var $thead = $("<thead style='background : #5197E3;'>").appendTo($("#hist-updated-shareholders"));
	$("<th>").text("Shareholder").appendTo($thead);
	$("<th>").text("Number of shares").appendTo($thead);
	$("<th>").text("Number of AIR tokens").appendTo($thead);
	$("<th>").text("Shares after AIR tokens conversion").appendTo($thead);
	holdersTab.forEach(displayShareTokens);
	$("<button class='btn btn-primary btn-sm' onclick='percentages()' id='percent'>").text("Get %").appendTo($thead);
	function displayShareTokens(account) {
		var compContract = new web3.eth.Contract(g_equity_token_abi, g_data.companies[i].equityContract);
		compContract.methods.balanceOf(account).call((err,shares) => {
			var $tr = $("<tr>").attr("id","tr" + $("#hist-updated-shareholders .shares").length).appendTo($("#hist-updated-shareholders"));
			var $td = $("<td style='text-align: left;'>").text(map[account]).appendTo($($tr));
			$("<a>").attr("href", "https://ropsten.etherscan.io/address/" + account).text(" (" + account.substring(0, 10) + "...)" ).appendTo($td);
			var $td = $("<td class='shares'>").text(shares).attr("id", "shares"+ $("#hist-updated-shareholders .shares").length).appendTo($tr);
			addFormat($td[0]);
			var airContract = new web3.eth.Contract(g_aircontract_abi, g_data.companies[i].airContract);
			airContract.methods.balanceOf(account).call((err,airTokens) => {
				$td = $("<td class='tokens'>").attr("id", "tokens"+ $("#hist-updated-shareholders .tokens").length).text(airTokens).appendTo($tr);
				addFormat($td[0]);
				if(Object.keys(g_data.companies[i].fundRaise).length != 0) {
					airContract.methods.getShareRequestConversion(account).call((err,res) => {
						if(!err){
							$td = $("<td class='convert'>").attr("id", "convert"+ $("#hist-updated-shareholders .convert").length).text(res + shares).appendTo($tr);
							addFormat($td[0]);
						}});
				}
				else{
					$td = $("<td class='convert'>").attr("id", "convert"+ $("#hist-updated-shareholders .convert").length).text("0").appendTo($tr);
				}
			});
		});	
	}
	/*Conversion table*/
	$("#conversion-air").empty();
	var $thead = $("<thead class='thead-dark'>").appendTo($("#conversion-air"));
	$("<th>").text("Timestamp of block #").appendTo($thead);
	$("<th>").text("Investor").appendTo($thead);
	$("<th>").text("AIR tokens converted").appendTo($thead);
	$("<th>").text("Shares retrieved").appendTo($thead);
	
	if(g_data.companies[i].conversion != undefined) {
		for(var j = 0 ; j < g_data.companies[i].conversion.length; j++){
			var $tr = $("<tr>").appendTo($("#conversion-air"));
			setTimestamp($tr, i, j, 'conversion');
			var $td = $("<td style='text-align: center;'>").text(g_data.companies[i].conversion[j].newShares).appendTo($tr);	
			addFormat($td[0]);
		}
	}
	else{
		$("<td colspan=4>").text("No AIR tokens conversion yet").appendTo($("<tr>").appendTo($("#conversion-air")));
	}
}