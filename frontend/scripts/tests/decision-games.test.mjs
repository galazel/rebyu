import assert from 'node:assert/strict'
import { applySimulationChoice, simulationState, storyState } from '../../src/lib/decision-games.js'
const story = {startId:'start',nodes:[{id:'start',text:'Decision',choices:[{text:'A',nextId:'a',feedback:'A outcome'},{text:'B',nextId:'b'}]},{id:'a',text:'Ending A',choices:[]},{id:'b',text:'Ending B',choices:[]}]}
assert.equal(storyState(story,[0]).node.text,'Ending A')
assert.equal(storyState(story,[1]).node.text,'Ending B')
assert.equal(storyState(story,[99]).node.id,'start')
const simulation = {resources:[{name:'Budget',initial:100,minimum:0},{name:'Quality',initial:0,minimum:0}],rounds:[{choices:[{effects:[{resource:'Budget',delta:-60},{resource:'Quality',delta:6}]}]},{choices:[{effects:[{resource:'Budget',delta:-30},{resource:'Quality',delta:3}]}]}]}
const end=simulationState(simulation,[0,0])
assert.deepEqual(end.values,{Budget:10,Quality:9})
assert.equal(applySimulationChoice(simulation.resources,end.values,{effects:[{resource:'Budget',delta:-20}]}),null)
assert.deepEqual(simulationState(simulation,[]).values,{Budget:100,Quality:0})
assert.equal(simulationState(simulation,[99,0]).decisions.length,0)
console.log('PASS: distinct story outcomes, legal simulation budgets, replay/reset and corrupt-history handling.')
