function gameTick() {
	var tickTime=new Date().getTime()
	if (player.lastTick>0) {
		if (tickTime-lastSave>59999) {
			saveGame()
		}
		
		var delta=(tickTime-player.lastTick)/1000
		if (player.currentStone.hp.lte(0)) {
			player.stone=player.stone.add(1)
			player.totalStone=player.totalStone.add(1)
			player.currentStone.hp=player.currentStone.maxHp
		}
	}
	player.lastTick=tickTime
	
	updateElement('resources','Stone: '+format(player.stone)+' | Coins: '+format(player.coins)+' | Rank: '+player.rank)
	if (currentTab=='quarry') {
		updateElement('hp',format(player.currentStone.hp)+'/'+format(player.currentStone.maxHp))
	}
}

function mineStone() {
	player.currentStone.hp=player.currentStone.hp.sub(1)
}