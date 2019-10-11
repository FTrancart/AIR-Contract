var ManagerContract = artifacts.require("./ManagerContract.sol");
var FakeDaiToken = artifacts.require("./token/ERC20/ERC20Mintable.sol");

module.exports = function(deployer, network, accounts) {
	deployer.deploy(FakeDaiToken, {from : accounts[0]}).then(y => {
		console.log("FakeDaiToken address : " + y.address);
		y.mint(accounts[0], 1000000000);
		return y;
	}).then(y => {
		return ManagerContract.new(y.address).then(x => {
			return {manager : x, cashtoken : y };
		});
	}).then(res => {
		console.log("ManagerContract address is : " + res.manager.address);
		return res.cashtoken.addMinter(res.manager.address)
	}).then(x=> {
		console.log("Minter added");
	});
};
