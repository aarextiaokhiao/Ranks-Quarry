function showElement(elementID,style) {
	document.getElementById(elementID).style.display=style
}
	
function hideElement(elementID) {
	document.getElementById(elementID).style.display='none'
}
	
function moveElement(elementID,moveTo) {
	document.getElementById(moveTo).appendChild(document.getElementById(elementID))
}
	
function updateClass(elementID,value) {
	document.getElementById(elementID).className=value
}
	
function updateStyle(elementID,styleID,value) {
	document.getElementById(elementID).style[styleID]=value
}

function updateElement(elementID,value) {
	document.getElementById(elementID).innerHTML=value
}

function switchTab(id) {
	hideElement('tab_'+currentTab)
	showElement('tab_'+id,'block')
	currentTab=id
}

function format(value) {
	if (!(value instanceof Decimal)) value=new Decimal(value)
		
	if (value.exponent>=9000000000000000) {
		if (value.mantissa<0) return '-&#x221e;'
		return '&#x221e;'
	}
	if (Number.isNaN(value.mantissa)) return '?'
	var mantissa
	if (value.lt(1e3)) {
		mantissa=value.toFixed(0)
		if (parseFloat(mantissa)!=1e3) return mantissa
	}
	if (player.options.notation==0) {
		//Scientific
		var unencoded=format1OoMGroup(value)
		if (Decimal.gte(unencoded.exponent,1e5)) {
			var unencodedExp=format1OoMGroup(new Decimal(unencoded.exponent))
			return unencoded.mantissa.toFixed(2)+'e'+unencodedExp.mantissa.toFixed(2)+'e'+unencodedExp.exponent
		}
		return unencoded.mantissa.toFixed(2)+'e'+unencoded.exponent
	} else if (player.options.notation==1) {
		//Engineering
		var unencoded=format3OoMGroup(value)
		if (Decimal.gte(unencoded.group,3333.3)) {
			var unencodedExp=format3OoMGroup(Decimal.times(unencoded.group,3))
			return unencoded.mantissa.toFixed(2-unencoded.offset)+'e'+unencodedExp.mantissa.toFixed(2-unencodedExp.offset)+'e'+unencodedExp.group*3
		}
		return unencoded.mantissa.toFixed(2-unencoded.offset)+'e'+unencoded.group*3
	} else if (player.options.notation==2) {
		//Standard
		var unencoded=format3OoMGroup(value)
		return unencoded.mantissa.toFixed(2-unencoded.offset)+standard(unencoded.group)
	} else if (player.options.notation==3) {
		//Logarithm
		var log=value.log10()
		if (Decimal.gte(log,99999.995)) {
			return 'ee'+Decimal.log10(log).toFixed(2)
		}
		return 'e'+log.toFixed(2)
	}
	return '?'
}

function format1OoMGroup(value) {
	var mantissa=Math.round(value.mantissa*100)/100
	var exponent=value.exponent
	if (mantissa==10) {
		mantissa=1
		exponent=exponent+1
	}
	return {mantissa:mantissa,exponent:exponent}
}

function format3OoMGroup(value) {
	var mantissa=Math.round(value.mantissa*100)/100
	var exponent=value.exponent
	if (mantissa==10) {
		mantissa=1
		exponent=exponent+1
	}
	var result={offset:exponent%3}
	result.mantissa=mantissa*Math.pow(10,result.offset)
	result.group=Math.floor(exponent/3)
	return result
}

function loadGame() {
	var undecodedSave=localStorage.getItem("MTUyMzk5ODg3Njk1MA==")
	if (undecodedSave!=null) loadSave(undecodedSave)
	updateStyle('loading','top','-100%')
	showElement('mainGame','block')
	setTimeout(function(){hideElement('loading')},2000)
	setInterval(gameLoop,50)
}

function saveGame() {
	try {
		localStorage.setItem("MTUyMzk5ODg3Njk1MA==",btoa(JSON.stringify(player)))
		lastSave=new Date().getTime()
	} catch (e) {
		console.log('A error has been occurred while saving:')
		console.error(e)
	}
}

function loadSave(savefile) {
	try {
		savefile=JSON.parse(atob(savefile))
		
		savefile.currentStone.hp=new Decimal(savefile.currentStone.hp)
		savefile.currentStone.maxHp=new Decimal(savefile.currentStone.maxHp)
		savefile.stone=new Decimal(savefile.stone)
		savefile.totalStone=new Decimal(savefile.totalStone)
		for (var name in savefile.ores) savefile.ores[name]=new Decimal(savefile.ores[name])
		savefile.coins=new Decimal(savefile.coins)
		savefile.totalCoins=new Decimal(savefile.totalCoins)
	
		player=savefile
	} catch (e) {
		console.log('A error has been occurred while loading:')
		console.error(e)
	}
}

function exportSave() {
}

function importSave() {
	loadSave(prompt('Copy and paste in your exported file and press enter.'))
}

function resetGame() {
}

function gameLoop() {
	if (tickDone) {
		tickDone=false
		setTimeout(function(){
			var startTime=new Date().getTime()
			try {
				gameTick()
			} catch (e) {
				console.log('A game error has occured:')
				console.error(e)
			}
			tickSpeed=Math.max((new Date().getTime()-startTime)*0.2+tickSpeed*0.8,50)
			startTime=new Date().getTime()
			tickDone=true
		},tickSpeed-50)
	}
}