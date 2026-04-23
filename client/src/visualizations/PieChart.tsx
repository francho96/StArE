import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { DocumentData } from './BubbleChart';

export default function PieChartComponent({ data }: { data: any }) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (chartRef.current) {
        const { clientWidth, clientHeight } = chartRef.current;
        setContainerSize({
          width: clientWidth,
          height: clientHeight,
        });
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    if (chartRef.current) resizeObserver.observe(chartRef.current);

    return () => resizeObserver.disconnect();
  }, [data]);

  useEffect(() => {
    if (
      !data ||
      !data.documents ||
      data.documents.length === 0 ||
      containerSize.width === 0
    )
      return;

    const documents: DocumentData[] = data.documents;

    // Aggregate by language or just show distribution of length
    const aggregated = documents.reduce((acc: any, d) => {
      const lang = d.metrics.language || 'Unknown';
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {});

    const pieData = Object.entries(aggregated).map(([label, value]) => ({
      label,
      value: value as number,
    }));

    const width = containerSize.width;
    const height = Math.min(500, containerSize.height);
    const radius = Math.min(width, height) / 2 - 40;

    d3.select(chartRef.current).selectAll('*').remove();

    const svg = d3
      .select(chartRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3
      .scaleOrdinal()
      .domain(pieData.map((d) => d.label))
      .range(d3.schemeCategory10);

    const pie = d3.pie<any>().value((d) => d.value);

    const arc = d3.arc<any>().innerRadius(0).outerRadius(radius);

    // tooltip
    const tooltip = d3
      .select(chartRef.current)
      .append('div')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('color', 'white')
      .style('padding', '8px')
      .style('background-color', 'rgba(0,0,0,0.8)')
      .style('border-radius', '6px')
      .style('font-family', 'Arial')
      .style('font-size', '12px')
      .style('z-index', '1000')
      .style('pointer-events', 'none');

    const arcs = svg
      .selectAll('arc')
      .data(pie(pieData))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => color(d.data.label) as string)
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .style('opacity', 0.8)
      .on('mouseover', function (event: any, d: any) {
        d3.select(this).attr('fill', '#ff6b6b');
        tooltip
          .html(`<strong>${d.data.label}</strong><br/>Count: ${d.data.value}`)
          .style('visibility', 'visible');
      })
      .on('mousemove', function (event: any) {
        tooltip
          .style('top', event.pageY - 10 + 'px')
          .style('left', event.pageX + 10 + 'px');
      })
      .on('mouseout', function (event: any, d: any) {
        d3.select(this).attr('fill', color(d.data.label) as string);
        tooltip.style('visibility', 'hidden');
      });

    // Labels
    arcs
      .append('text')
      .attr('transform', (d) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', 'white')
      .text((d) => (d.data.value > 0 ? d.data.label : ''));

    // Title
    svg
      .append('text')
      .attr('x', 0)
      .attr('y', -radius - 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', 'currentColor')
      .text('Language Distribution');
  }, [containerSize, data]);

  return (
    <div
      ref={chartRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        position: 'relative',
      }}
    />
  );
}
