import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { DocumentData } from './BubbleChart';

export default function BarChartComponent({ data }: { data: any }) {
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
    const margin = { top: 40, right: 30, bottom: 60, left: 60 };
    const width = containerSize.width - margin.left - margin.right;
    const height =
      Math.min(500, containerSize.height) - margin.top - margin.bottom;

    d3.select(chartRef.current).selectAll('*').remove();

    const svg = d3
      .select(chartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .range([0, width])
      .domain(documents.map((d, i) => i.toString()))
      .padding(0.2);

    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3.axisBottom(x).tickFormat((_d: string, i: number) => {
          const title = documents[i].title;
          return title.length > 10 ? title.substring(0, 10) + '...' : title;
        }),
      )
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end');

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(documents, (d) => d.metrics.length || 0) as number])
      .nice()
      .range([height, 0]);

    svg.append('g').call(d3.axisLeft(y));

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

    svg
      .selectAll('rect')
      .data(documents)
      .enter()
      .append('rect')
      .attr('x', (d, i) => x(i.toString())!)
      .attr('y', (d) => y(d.metrics.length || 0))
      .attr('width', x.bandwidth())
      .attr('height', (d) => height - y(d.metrics.length || 0))
      .attr('fill', '#4ecdc4')
      .attr('rx', 4)
      .on('mouseover', function (_event: any, d: DocumentData) {
        d3.select(this).attr('fill', '#ff6b6b');
        tooltip
          .html(`<strong>${d.title}</strong><br/>Length: ${d.metrics.length}`)
          .style('visibility', 'visible');
      })
      .on('mousemove', function (event: any) {
        tooltip
          .style('top', event.pageY - 10 + 'px')
          .style('left', event.pageX + 10 + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).attr('fill', '#4ecdc4');
        tooltip.style('visibility', 'hidden');
      })
      .on('click', (event, d) => window.open(d.link, '_blank'));

    // Title
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', 'currentColor')
      .text('Document Length Comparison');
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
