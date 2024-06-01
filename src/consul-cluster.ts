import { LitElement, TemplateResult, css, html, nothing } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import axios from 'axios'
import * as d3 from 'd3';
import { Coord, Coordinates, E, Network, V } from './models'
import { FConfig } from './force-config';

const DEFAULT_FORCE = {
  charge: -0.3,
  center: 0.1,
  link: 0.2
};

@customElement('consul-cluster')
export class ConsulCluster extends LitElement {

  @property({ type: Number })
  count = 0

  @property({type: Boolean})
  config = true;

  force: FConfig = DEFAULT_FORCE

  alpha_decay = 0
  root?: ShadowRoot | null;
  network: Network = {nodes: [], links: []};
  simulation: d3.Simulation<V, E> | undefined;
  circles: TemplateResult[] = [];
  lines: TemplateResult[] = [];

  _width?: number;
  _height?: number;
  center: {x: number, y: number} = {x: 50, y: 50};

  firstUpdated() {
    this.fetchCoords();
    // Access the shadow root and manipulate the elements inside it
    this.root = this.shadowRoot;
    this.simulation = d3.forceSimulation();
    this.updateForce();
    this.simulation.alphaDecay(this.alpha_decay);
    this.simulation.on("tick", this.ticker(this));
  }

  updateForce(e?: {detail: any}) {
    this.force = e?.detail?.value ?? this.force;
    this.simulation?.force("charge_force", d3.forceManyBody().strength(this.force.charge));
    this.simulation?.force("center_force", d3.forceCenter(this.center.x, this.center.y).strength(this.force.center));
    this.updateSimulation();
  }

  render() {
    return html`
      <slot></slot>
      ${this.config ? html`<force-config @value-changed="${this.updateForce}" .force="${this.force}"></force-config>` : nothing}
      <div class="card">
        <button @click=${this._onClick} part="button">
          reload (${this.count})
        </button>
      </div>
      <div id="container" class="container">
        <svg id="force" height="50vh" width="100%" viewBox="0 0 100 100">
          <defs>
            <pattern id="consul" x="0%" y="0%" height="100%" width="100%" viewBox="0 0 100 100">
              <image x="0%" y="0%" height="100" width="100" xlink:href="/consul.svg"></image>
            </pattern>
          </defs>
        </svg>
      </div>
    `
  }

  private async fetchCoords() {
    console.log("fetch");
    await axios.get('/api')
    .then(r => {
      this.network = this.genNetwork(r.data[0].Coordinates);
      this.updateSimulation();
    })
    .catch(err => {
      console.error(err);
      this.simulation?.stop();
    });
  }

  getSVG() : Element | null | undefined {
    return this.root?.querySelector("#container > svg");
  }

  dragstarted(event: any, d: d3.SimulationNodeDatum): void {
    if (!event.active) this.simulation?.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  dragged(event: any, d: d3.SimulationNodeDatum): void {
      d.fx = event.x;
      d.fy = event.y;
  }

  dragended(event: any, d: d3.SimulationNodeDatum): void {
      if (!event.active) this.simulation?.alphaTarget(0);
      d.fx = null;
      d.fy = null;
  }

  getLinks(): d3.Selection<d3.BaseType | SVGLineElement, E, Element, unknown> {
    const svg = this.getSVG();
    if (svg && this.network) {
      return d3.select(svg)
        .selection()
        .selectAll("line")
        .data(this.network.links)
        .join("line")
        .attr("stroke-width", 2)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 0.05)
        .attr("id", d => d.id)
        .attr("source", d => (d.source as V).id)
        .attr("target", d => (d.target as V).id)
        ;
    }
    return d3.selectAll("none");
  }

  getNodes(): d3.Selection<SVGCircleElement | d3.BaseType, V, Element, unknown> {
    const svg = this.getSVG();
    if (svg && this.network) {
      
      return d3.select(svg)
      .selection()
      .selectAll("circle")
      .data(this.network.nodes)
      .join("circle")
      .call<V[]>(d3.drag()
        .on("start", this.dragstarted)
        .on("drag", this.dragged)
        .on("end", this.dragended)
      )
      .attr("r", 3)
      //.attr("fill", "#c13e3e")
      .attr("fill", "url(#consul)")
      .attr("class", "node")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 0.2)
      .attr("id", d => d.id)
      ;
      //.append("text").text(d => d.id).attr("dx", d => -25)
      //.on("click", function(d) {
      //  console.log("CLICK: ", d);
      //})
      ;
    }
    return d3.selectAll("none");
  }

  getNodeLabels(): d3.Selection<SVGTextElement | d3.BaseType, V, Element, unknown> {
    const svg = this.getSVG();
    if (svg && this.network) {
      // node labels
      return d3.select(svg)
        .selection()
        .selectAll("text")
        .data(this.network.nodes)
        .join("text")
        .attr("id", d => d.id)
        .attr("class", "label")
        .attr("font-size", "2px")
        .attr("fill", "black")
        .attr("stroke", "white")
        .attr("stroke-width", 0.15)
        .attr("dy", 7)
        .attr("dx", -10)
        .text(d => d.id);
    }
    return d3.selectAll("none");
  }

  /*xpos(s, t) {
    var angle = Math.atan2(t.y - s.y, t.x - s.x);
    return 30 * Math.cos(angle) + s.x;
  };
  
  ypos(s, t) {
    var angle = Math.atan2(t.y - s.y, t.x - s.x);
    return 30 * Math.sin(angle) + s.y;
  };*/

  getLinkLabels(): d3.Selection<SVGTextPathElement, E, Element, unknown> {
    const svg = this.getSVG();
    if (svg && this.network) {
      // node labels
      return d3.select(svg)
        .selection()
        .selectAll("link")
        .data(this.network.links)
        .join("text")
        .attr("id", d => d.id)
        //.attr("x", d => this.xpos(d.source, d.target))
        //.attr("y", d => this.ypos(d.source, d.target))
        .attr("class", "label")
        .attr("paint-order", "stroke")
        .attr("stroke", "white")
        .attr("stroke-width", 0.1)
        .attr("stroke-opacity", 1)
        .attr("stroke-linecap", "butt")
        .attr("stroke-linejoin", "miter")
        .style("fill", "black")
        .attr("dy", 5)
        .append("textPath")
        .attr("startOffset", "50%")
        .text(d => d.ping);
    }
    return d3.selectAll("none");
  }

  updateSimulation() {
    const svg = this.getSVG();
    if (svg && this.simulation) {
      this.simulation.nodes(this.network.nodes);
      this.simulation.force("link", d3
        .forceLink(this.network.links)
        .id(d => (d as V).id)
        .strength(d => d.strength * this.force.link)
      )
    }
  }

  public ticker(that: ConsulCluster) {
    return () => {
      const svg = that.getSVG();
      const links = that.getLinks();
      const nodes = that.getNodes();
      const nodeLabels = that.getNodeLabels();
      //const linkLabels = that.getLinkLabels();
      if (svg) {
        links
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);

        nodes
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);

        nodeLabels
          .attr("x", d => d.x)
          .attr("y", d => d.y);
        /*linkLabels
          .attr("dx", this.center.x)
          .attr("dy", this.center.y);*/
      }
    }
  }


  private genNetwork(vertices: [Coordinates]): Network {
    var links: E[] = [];
    const nodes = vertices.map(c => ({
      id: c.Node,
      name: c.Node,
      group: 'nodes'
    }));
    for (var i = 0; i < vertices.length; i++) {
      for (var j = i+1; j < vertices.length; j++) {
        links.push({
          id: `${i}.${j}`,
          source: vertices[i].Node,
          target: vertices[j].Node,
          ping: this.distance(vertices[i].Coord, vertices[j].Coord),
          strength: 0
        });
      }
    }
    // normalizing
    const ds = links.map(l => l.ping);
    const low = Math.min(...ds);
    const high = Math.max(...ds);
    links.forEach(l => l.strength = (l.ping - low)/high);
    return {links, nodes}
  }

  private distance(a: Coord, b: Coord): number {
      // Coordinates will always have the same dimensionality, so this is
      // just a sanity check.
      if (a.Vec.length != b.Vec.length) {
          console.error("dimensions aren't compatible")
      }
  
      // Calculate the Euclidean distance plus the heights.
      var sumsq = 0.0
      for(var i = 0; i < a.Vec.length; i++) {
          const diff = a.Vec[i] - b.Vec[i]
          sumsq += diff * diff
      }
      var rtt = Math.sqrt(sumsq) + a.Height + b.Height
  
      // Apply the adjustment components, guarding against negatives.
      const adjusted = rtt + a.Adjustment + b.Adjustment
      if (adjusted > 0.0) {
          rtt = adjusted
      }
      return rtt * 1000 // in msecs
  }

  private _onClick() {
    this.count++;
    this.fetchCoords();
  }

  static styles = css`
    :host {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }

    .logo {
      height: 6em;
      padding: 1.5em;
      will-change: filter;
      transition: filter 300ms;
    }
    .logo:hover {
      filter: drop-shadow(0 0 2em #646cffaa);
    }
    .logo.lit:hover {
      filter: drop-shadow(0 0 2em #325cffaa);
    }

    .card {
      display: flex;
      flex-direction: column;
      padding: 2em;
      justify-content: center;
    }

    ::slotted(h1) {
      font-size: 3.2em;
      line-height: 1.1;
    }

    a {
      font-weight: 500;
      color: #646cff;
      text-decoration: inherit;
    }
    a:hover {
      color: #535bf2;
    }

    button {
      border-radius: 8px;
      border: 1px solid transparent;
      padding: 0.6em 1.2em;
      font-size: 1em;
      font-weight: 500;
      font-family: inherit;
      background-color: #1a1a1a;
      cursor: pointer;
      transition: border-color 0.25s;
    }
    button:hover {
      border-color: #646cff;
    }
    button:focus,
    button:focus-visible {
      outline: 4px auto -webkit-focus-ring-color;
    }

    @media (prefers-color-scheme: light) {
      a:hover {
        color: #747bff;
      }
      button {
        background-color: #f9f9f9;
      }
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'consul-cluster': ConsulCluster
  }
}
