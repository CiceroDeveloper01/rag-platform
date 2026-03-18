type AnnotationConfig<T> = {
  reducer?: (previous: T, next: T) => T;
  default?: () => T;
};

type AnnotationRootShape = Record<string, AnnotationConfig<unknown>>;
type GraphState = Record<string, unknown>;
type NodeHandler = (state: GraphState) => Promise<Partial<GraphState>>;

type ConditionalEdge = {
  from: string;
  resolver: (state: GraphState) => string;
  routes: Record<string, string>;
};

type GraphDefinition = {
  root: AnnotationRootShape;
  nodes: Map<string, NodeHandler>;
  edges: Map<string, string>;
  conditionalEdges: ConditionalEdge[];
};

function createAnnotation<T>(_config?: AnnotationConfig<T>): AnnotationConfig<T> {
  return _config ?? {};
}

createAnnotation.Root = <T extends AnnotationRootShape>(shape: T) => ({
  State: {} as {
    [K in keyof T]: unknown;
  },
  shape,
});

export const Annotation = createAnnotation;
export const START = "__start__";
export const END = "__end__";

export class StateGraph<TState extends { shape: AnnotationRootShape }> {
  private readonly definition: GraphDefinition;

  constructor(private readonly state: TState) {
    this.definition = {
      root: state.shape,
      nodes: new Map(),
      edges: new Map(),
      conditionalEdges: [],
    };
  }

  addNode(name: string, handler: NodeHandler): this {
    this.definition.nodes.set(name, handler);
    return this;
  }

  addEdge(from: string, to: string): this {
    this.definition.edges.set(from, to);
    return this;
  }

  addConditionalEdges(
    from: string,
    resolver: (state: GraphState) => string,
    routes: Record<string, string>,
  ): this {
    this.definition.conditionalEdges.push({ from, resolver, routes });
    return this;
  }

  compile() {
    return {
      invoke: async (input: GraphState) => {
        const state = this.initializeState(input);
        let current = this.definition.edges.get(START);

        while (current && current !== END) {
          const handler = this.definition.nodes.get(current);
          if (!handler) {
            throw new Error(`Graph node "${current}" is not registered`);
          }

          Object.assign(state, await handler(state));

          const conditional = this.definition.conditionalEdges.find(
            (edge) => edge.from === current,
          );

          if (conditional) {
            const routeKey = conditional.resolver(state);
            current = conditional.routes[routeKey];
            continue;
          }

          current = this.definition.edges.get(current);
        }

        return state;
      },
    };
  }

  private initializeState(input: GraphState): GraphState {
    const initialState: GraphState = {};

    for (const [key, config] of Object.entries(this.definition.root)) {
      initialState[key] = key in input ? input[key] : config.default?.();
    }

    return {
      ...initialState,
      ...input,
    };
  }
}
