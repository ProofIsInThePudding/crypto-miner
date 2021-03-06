const Vault = artifacts.require("./ChestVault");

contract('ChestVault', function(accounts) {
	it("chest vault: using the vault", async function() {
		await assertThrowsAsync(async () => await Vault.new(0, 0));
		await assertThrowsAsync(async () => await Vault.new(accounts[0], 0));
		await assertThrowsAsync(async () => await Vault.new(0, accounts[1]));
		await assertThrowsAsync(async () => await Vault.new(accounts[0], accounts[0]));
		const vault = await Vault.new(accounts[0], accounts[1]);

		const acc3_balance = await web3.eth.getBalance(accounts[3]);
		const investment = web3.toWei(1, "ether");

		const fn0 = async () => await vault.withdraw(accounts[3]);
		const fn1 = async () => await vault.withdraw(accounts[3], {from: accounts[1]});
		const fn2 = async () => await vault.withdraw(accounts[3], {from: accounts[2]});
		const r0 = async() => await vault.revoke();
		const r1 = async() => await vault.revoke({from: accounts[1]});
		const r2 = async() => await vault.revoke({from: accounts[2]});

		await assertThrowsAsync(fn0);
		await assertThrowsAsync(fn1);
		await assertThrowsAsync(fn2);
		await assertThrowsAsync(r0);
		await assertThrowsAsync(r1);
		await assertThrowsAsync(r2);

		await web3.eth.sendTransaction({from: accounts[0], to: vault.address, value: investment});
		assert.equal(investment, await web3.eth.getBalance(vault.address), "wrong vault balance after transferring 1 ether");

		await assertThrowsAsync(fn0);
		await assertThrowsAsync(fn1);
		await assertThrowsAsync(fn2);
		await assertThrowsAsync(r0);
		await assertThrowsAsync(r1);
		await assertThrowsAsync(r2);

		await increaseTime(7862400); // 91 day in seconds
		await assertThrowsAsync(fn2);
		await assertThrowsAsync(r2);
		await fn0();
		await assertThrowsAsync(fn0);
		await r0();
		await assertThrowsAsync(r0);
		await fn1();
		await assertThrowsAsync(fn1);
		await r1();
		await assertThrowsAsync(r1);
		await fn0();
		await fn1();
		await assertThrowsAsync(fn0);
		await assertThrowsAsync(fn1);
		await assertThrowsAsync(fn2);
		await assertThrowsAsync(r0);
		await assertThrowsAsync(r1);
		await assertThrowsAsync(r2);

		const acc3_balance1 = await web3.eth.getBalance(accounts[3]);
		const acc3_expected = acc3_balance.plus(investment);
		assert.equal(0, await web3.eth.getBalance(vault.address), "wrong vault balance after funds withdrawal");
		assert(acc3_expected.eq(acc3_balance1), "wrong accounts[3] balance after funds withdrawal to it");
	});
});

async function assertThrowsAsync(fn) {
	let f = function() {};
	try {
		await fn();
	}
	catch(e) {
		f = function() {
			throw e;
		};
	}
	finally {
		assert.throws(f);
	}
}

const increaseTime = function(duration) {
	const id = Date.now();

	return new Promise((resolve, reject) => {
		web3.currentProvider.sendAsync({
			jsonrpc: '2.0',
			method: 'evm_increaseTime',
			params: [duration],
			id: id,
		}, err1 => {
			if (err1) return reject(err1);

			web3.currentProvider.sendAsync({
				jsonrpc: '2.0',
				method: 'evm_mine',
				id: id + 1,
			}, (err2, res) => {
				return err2 ? reject(err2) : resolve(res)
			})
		})
	})
};
