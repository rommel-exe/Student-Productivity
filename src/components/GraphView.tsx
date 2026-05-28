import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { NotePage } from '../types';

interface GraphViewProps {
  pages: NotePage[];
  onSelectPage: (id: string) => void;
  currentPageId?: string;
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  val: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
}

export default function GraphView({ pages, onSelectPage, currentPageId }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const nodes: Node[] = pages.map((page) => ({
      id: page.id,
      name: page.title || 'Untitled',
      val: 1,
    }));

    const links: Link[] = [];
    pages.forEach((page) => {
      pages.forEach((otherPage) => {
        if (page.id !== otherPage.id && otherPage.title) {
          if (page.content?.includes(otherPage.title)) {
            links.push({ source: page.id, target: otherPage.id });
          }
        }
      });
    });

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(containerRef.current)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%');

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = g.append('g')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 2);

    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'cursor-pointer')
      .on('click', (event, d) => {
        onSelectPage(d.id);
      })
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );

    node.append('circle')
      .attr('r', (d) => d.id === currentPageId ? 12 : 8)
      .attr('fill', (d) => d.id === currentPageId ? '#4f46e5' : '#818cf8');

    node.append('text')
      .text((d) => d.name)
      .attr('x', 14)
      .attr('y', 4)
      .attr('class', 'text-xs font-sans fill-slate-700 pointer-events-none select-none');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
      svg.remove();
    };
  }, [pages, currentPageId, onSelectPage]);

  return (
    <div className="w-full h-full bg-white relative overflow-hidden" id="d3-graph-container">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
}
