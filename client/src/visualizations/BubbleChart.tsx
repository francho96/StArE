import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { bubbleChart } from '../../../Stare/visualizations/bubbleChart';

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
