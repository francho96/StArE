import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function BubbleChartComponent({ data }: any) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  console.log(data);
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
    window.addEventListener('resize', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, [data]);

  useEffect(() => {
    let chart: any;

    const renderDataBubbleChart = async () => {
      try {
        const json = data;
        chart = bubbleChart()
          .height(600)
          .width(700)
          .forceApart(-600)
          .maxRadius(70)
          .minRadius(10)
          .attrRadius('length')
          .transition(1000)
          .showTitleOnCircle(true)
          .customColors('perpiscuity', 'A3', false);

        if (chartRef.current) {
          d3.select(chartRef.current).selectAll('*').remove();
          d3.select(chartRef.current).datum(json).call(chart);
        }
      } catch (error) {
        console.error('Error cargando el gráfico:', error);
      }
    };

    if (containerSize.width > 0 && containerSize.height > 0) {
      console.log('aaa');
      renderDataBubbleChart();
    }

    return () => {
      if (chart && chartRef.current) {
        d3.select(chartRef.current).selectAll('*').remove();
      }
    };
  }, [containerSize, data]);

  return (
    <div
      ref={chartRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        maxHeight: '800px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '8px',
      }}
    />
  );
}


interface DocumentData {
  [key: string]: any;
  title: string;
  snippet: string;
  link: string;
  length?: number;
  perpiscuity?: number;
}

interface BubbleChart {
  (selection: d3.Selection<d3.BaseType, any, d3.BaseType, any>): BubbleChart;
  width(value?: number): number | BubbleChart;
  height(value?: number): number | BubbleChart;
  minRadius(value?: number): number | BubbleChart;
  maxRadius(value?: number): number | BubbleChart;
  forceApart(value?: number): number | BubbleChart;
  showTitleOnCircle(value?: boolean): boolean | BubbleChart;
  title(value?: string): string | BubbleChart;
  customColors(attr: string, pallette: string, blindsafe: boolean): BubbleChart;
  remove(callback?: () => void): BubbleChart;
  attrRadius(value?: string): string | BubbleChart;
  transition(value?: number): number | BubbleChart;
}

function bubbleChart(): BubbleChart {
  let width: number = 600;
  let transition: number = 500;
  let height: number = 400;
  let marginTop: number = 40;
  let minRadius: number = 8;
  let maxRadius: number = 50;
  let attrRadius: string = 'length';
  let attrColors: string = 'perpiscuity';
  let colorDomain: number[];
  let forceApart: number = -100;
  let customRange: string[];
  let customColors: boolean = false;
  let chartSelection: d3.Selection<d3.BaseType, any, d3.BaseType, any>;
  let chartSVG: d3.Selection<SVGSVGElement, any, d3.BaseType, any>;
  let title: string = "";
  let showTitleOnCircle: boolean = false;

  let simulation: d3.Simulation<DocumentData, undefined>;

  function chart(selection: d3.Selection<d3.BaseType, any, d3.BaseType, any>): BubbleChart {
    const data = selection.datum();
    const documents = data.documents;

    if (documents && documents.length > 0) {
      chartSelection = selection;
      const div = selection;
      
      const container = div.node() as HTMLElement;
      const containerWidth = container.clientWidth || width;
      const containerHeight = container.clientHeight || height;
      
      const actualWidth = containerWidth;
      const actualHeight = containerHeight;

      //console.log(containerWidth, containerHeight);
      //console.log( actualWidth, actualHeight);

      let svg = div.selectAll<SVGSVGElement, any>('svg').data([0]);
      svg = svg.enter()
        .append('svg')
        .merge(svg)
        .attr('width', '100%')  
        .attr('height', '100%') 
        .attr('viewBox', `0 0 ${actualWidth} ${actualHeight}`)
        .attr('preserveAspectRatio', 'xMidYMid meet') 

      chartSVG = svg;

      svg.selectAll("*").remove();

      const tooltip = selection
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("color", "white")
        .style("padding", "8px")
        .style("background-color", "rgba(0,0,0,0.8)")
        .style("border-radius", "6px")
        .style("font-family", "Arial")
        .style("width", "300px")
        .style("font-size", "12px")
        .style("z-index", "1000");

      let colorCircles: d3.ScaleOrdinal<string, string> | d3.ScaleLinear<number, string>;
      
      if (!customColors) {
        colorCircles = d3.scaleOrdinal(d3.schemeCategory10);
      } else {
        let min = Infinity, max = -Infinity;
        for (const e of documents) {
          const value = e[attrColors];
          if (value !== undefined && value !== null) {
            if (value < min) min = value;
            if (value > max) max = value;
          }
        }
        if (min === Infinity) {
          min = 0;
          max = 10;
        }
        colorDomain = [min, max];
        colorCircles = d3.scaleLinear<number, string>()
          .domain(colorDomain)
          .range(customRange);
      }

      const minRadiusDomain = d3.min(documents, (d: DocumentData) => {
        return d[attrRadius] ? +d[attrRadius] : 0;
      }) || 0;

      const maxRadiusDomain = d3.max(documents, (d: DocumentData) => {
        return d[attrRadius] ? +d[attrRadius] : 0;
      }) || 0;

      const responsiveMinRadius = Math.max(8, actualWidth * 0.02); 
      const responsiveMaxRadius = Math.min(80, actualWidth * 0.08); 

      const scaleRadius = d3.scaleLinear()
        .domain([minRadiusDomain, maxRadiusDomain])
        .range([responsiveMinRadius, responsiveMaxRadius]);

      const node = svg.selectAll<SVGGElement, DocumentData>("g")
        .data(documents)
        .enter()
        .append("g")
        .attr('transform', `translate(${actualWidth / 2}, ${actualHeight / 2})`);

      node.append("circle")
        .attr("r", (d: DocumentData) => {
          return d[attrRadius] ? scaleRadius(d[attrRadius]) : responsiveMinRadius;
        })
        .style("fill", (d: DocumentData) => {
          if (d[attrColors] !== undefined && d[attrColors] !== null) {
            if (customColors) {
              return (colorCircles as d3.ScaleLinear<number, string>)(d[attrColors]);
            } else {
              return (colorCircles as d3.ScaleOrdinal<string, string>)(d[attrColors].toString());
            }
          }
          return "#69b3a2";
        })
        .style("stroke", "#333")
        .style("stroke-width", "2px")
        .style("opacity", 0.8)
        .on("mouseover", function(event: MouseEvent, d: DocumentData) {
          tooltip.html(`
            <strong>${d.title}</strong><br/>
            ${d.snippet}<br/>
            <em>Length: ${d.length} | Score: ${d.perpiscuity}</em>
          `);
          d3.select(this).style("stroke", "yellow").style("stroke-width", "3px");
          tooltip.style("visibility", "visible");
        })
        .on("mousemove", function(event: MouseEvent) {
          tooltip.style("top", `${event.pageY - 10}px`)
                 .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", function() {
          d3.select(this).style("stroke", "#333").style("stroke-width", "2px");
          tooltip.style("visibility", "hidden");
        })
        .on("click", function(event: MouseEvent, d: DocumentData) {
          window.open(d.link, '_blank');
        });
      simulation = d3.forceSimulation<DocumentData>(documents)
        .force("charge", d3.forceManyBody<DocumentData>().strength(forceApart))
        .force("x", d3.forceX<DocumentData>(actualWidth / 2).strength(0.05))
        .force("y", d3.forceY<DocumentData>(actualHeight / 2).strength(0.05))
        .force("collision", d3.forceCollide<DocumentData>().radius((d: DocumentData) => {
          const radius = d[attrRadius] ? scaleRadius(d[attrRadius]) : responsiveMinRadius;
          return radius + 2;
        }))
        .alphaDecay(0.02)
        .on("tick", ticked);

      function ticked() {
        node.attr("transform", (d: any) => {
          const currentMaxRadius = d[attrRadius] ? scaleRadius(d[attrRadius]) : responsiveMinRadius;
          const x = Math.max(currentMaxRadius, Math.min(actualWidth - currentMaxRadius, d.x || actualWidth / 2));
          const y = Math.max(currentMaxRadius, Math.min(actualHeight - currentMaxRadius, d.y || actualHeight / 2));
          return `translate(${x}, ${y})`;
        });
      }

      if (title) {
        svg.append('text')
          .attr('x', actualWidth / 2)
          .attr('y', 30)
          .attr("text-anchor", "middle")
          .attr("font-size", Math.max(16, actualWidth * 0.02)) 
          .attr("fill", "#333")
          .text(title);
      }

      function handleResize() {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        
        if (newWidth > 0 && newHeight > 0) {
          svg.attr('viewBox', `0 0 ${newWidth} ${newHeight}`);
          
          const newMinRadius = Math.max(8, newWidth * 0.02);
          const newMaxRadius = Math.min(80, newWidth * 0.08);
          
          scaleRadius.range([newMinRadius, newMaxRadius]);
          
          node.selectAll("circle")
            .attr("r", (d: DocumentData) => {
              return d[attrRadius] ? scaleRadius(d[attrRadius]) : newMinRadius;
            });
          
          simulation.force("x", d3.forceX<DocumentData>(newWidth / 2))
                   .force("y", d3.forceY<DocumentData>(newHeight / 2))
                   .force("collision", d3.forceCollide<DocumentData>().radius((d: DocumentData) => {
                     const radius = d[attrRadius] ? scaleRadius(d[attrRadius]) : newMinRadius;
                     return radius + 2;
                   }));
          
          simulation.alpha(0.3).restart();
        }
      }

      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);

      chart.remove = function(callback?: () => void): BubbleChart {
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        if (simulation) {
          simulation.stop();
        }
        if (chartSVG) {
          chartSVG.selectAll("*").remove();
        }
        if (callback) callback();
        return chart;
      };
    }

    return chart;
  }


  function chartTransition(value?: number): number | BubbleChart {
    if (!arguments.length) return transition;
    transition = value!;
    return chart;
  }

  function chartWidth(value?: number): number | BubbleChart {
    if (!arguments.length) return width;
    width = value!;
    return chart;
  }

  function chartRadius(value?: string): string | BubbleChart {
    if (!arguments.length) return attrRadius;
    attrRadius = value!;
    return chart;
  }

  function chartHeight(value?: number): number | BubbleChart {
    if (!arguments.length) return height;
    height = value!;
    return chart;
  }

  function chartMinRadius(value?: number): number | BubbleChart {
    if (!arguments.length) return minRadius;
    minRadius = value!;
    return chart;
  }

  function chartMaxRadius(value?: number): number | BubbleChart {
    if (!arguments.length) return maxRadius;
    maxRadius = value!;
    return chart;
  }

  function chartForceApart(value?: number): number | BubbleChart {
    if (!arguments.length) return forceApart;
    forceApart = value!;
    return chart;
  }

  function chartTitle(value?: string): string | BubbleChart {
    if (!arguments.length) return title;
    title = value!;
    return chart;
  }

  function chartShowTitleOnCircle(value?: boolean): boolean | BubbleChart {
    if (!arguments.length) return showTitleOnCircle;
    showTitleOnCircle = value!;
    return chart;
  }

  function chartCustomColors(attr: string, pallette: string, blindsafe: boolean): BubbleChart {
    customColors = true;
    attrColors = attr;
    customRange = ["#ff6b6b", "#4ecdc4", "#45b7d1"];
    return chart;
  }

  chart.width = chartWidth;
  chart.height = chartHeight;
  chart.minRadius = chartMinRadius;
  chart.maxRadius = chartMaxRadius;
  chart.forceApart = chartForceApart;
  chart.showTitleOnCircle = chartShowTitleOnCircle;
  chart.title = chartTitle;
  chart.customColors = chartCustomColors;
  chart.remove = chartRemove;
  chart.attrRadius = chartRadius;
  chart.transition = chartTransition;

  return chart;
}

function chartRemove(callback?: () => void): BubbleChart {
  return chart;
}

export { bubbleChart };
export type { BubbleChart, DocumentData };