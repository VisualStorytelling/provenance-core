import * as API from './api'
import { generateUUID } from './utils'

export class ProvenanceGraph implements API.IProvenanceGraph {
  public application: API.Application
  private nodes: { [key: string]: API.StateNode }

  constructor(application: API.Application) {
    this.application = application
    this.nodes = {}
  }

  addNode(node: API.StateNode): void {
    if (this.nodes[node.id]) {
      throw new Error('Node already added')
    }
    this.nodes[node.id] = node
  }

  getStateNode(id: API.NodeIdentifier): API.StateNode {
    const result = this.nodes[id]
    if (!result) {
      throw new Error('Node id not found')
    }
    return this.nodes[id]
  }
}

export class ProvenanceGraphTracker implements API.IProvenanceGraphTracker {
  private graph: API.IProvenanceGraph
  private current: API.StateNode
  private functionRegistry: { [key: string]: API.ProvenanceEnabledFunction }

  constructor(graph: API.IProvenanceGraph, current?: API.StateNode) {
    this.graph = graph

    if (current) {
      this.current = current
    } else {
      this.current = {
        id: generateUUID(),
        label: '',
        parent: null,
        children: [],
        artifacts: {}
      }
    }

    this.functionRegistry = {}
  }

  /**
   * Register a new function into the provenance tracker (to be able to call it later)
   *
   * @param name The name of the new function to register
   * @param func The ProvenanceEnabledFunction to register
   *
   */
  registerFunction(name: string, func: API.ProvenanceEnabledFunction) {
    if (this.functionRegistry[name]) {
      throw new Error('Function already registred')
    }
    this.functionRegistry[name] = func
  }

  /**
   * Calls the action.do function with action.doArguments
   *
   * @param action
   *
   */
  applyActionToCurrentStateNode(action: API.Action): Promise<API.StateNode> {
    // Save the current node because this is is asynchronous
    const currentNode = this.current

    // Get the registered function from the action out of the registry
    const functionNameToExecute = action.do
    if (!this.functionRegistry[functionNameToExecute]) {
      throw new Error('Function not found in registry')
    }
    const promisedResult = this.functionRegistry[functionNameToExecute].apply(
      null,
      action.doArguments
    )

    // When the function promise resolves, we need to update the graph.
    promisedResult.then((actionResult: any) => {
      const newNode: API.StateNode = {
        id: generateUUID(),
        label: action.do + ' : ' + JSON.stringify(action.doArguments),
        actionResult,
        parent: null,
        children: [],
        artifacts: {}
      }

      const stateEdge: API.StateEdge = {
        previous: currentNode,
        action: action,
        next: newNode
      }
      newNode.parent = stateEdge
      currentNode.children.push(stateEdge)

      this.graph.addNode(newNode)

      return newNode
    })

    return promisedResult
  }

  /**
   * Finds shortest path between current node and node with request identifer.
   * Calls the do/undo functions of actions on the path.
   *
   * @param id
   */
  traverseToStateNode(id: API.NodeIdentifier): Promise<API.StateNode> {
    return Promise.resolve(this.current)
  }
}
