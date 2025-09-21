import * as d3 from 'd3';

interface Margin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

interface DocumentData {
    title: string;
    snippet: string;
    link: string;
    length?: number;
    [key: string]: any;
}

interface Data {
    documents: DocumentData[];
}

class BarChart {
    // Configurable Settings
    private margin: Margin = { top: 10, right: 0, bottom: 200, left: 50 };
    private width: number = 700;
    private transition: number = 500;
    private height: number = 600;
    private attrHeight: string = 'length';
    private minHeight: number = 10;
    private maxHeight: number = 300;
    private strokeColor: string = "black";
    private strokeSize: number = 2;
    private padding: number = 2;
    private attrColors: string = 'length';
    private axes: boolean = true;
    private customColors: boolean = false;
    private colorDomain?: number[];
    private customRange?: string[];
    private title?: string;
    
    private chartSelection?: d3.Selection<d3.BaseType, unknown, HTMLElement, any>;
    private chartSVG?: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;

    constructor() {
        this.width = this.width - this.margin.left - this.margin.right;
        this.height = this.height - this.margin.top - this.margin.bottom;
    }

    /**
     * GENERATION OF THE ACTUAL CHART
     * @public
     * @param selection - is the div ID in which the chart will be rendered.
     */
    public chart(selection: d3.Selection<d3.BaseType, unknown, HTMLElement, any>): BarChart {
        const data = selection.datum() as Data;
        const documents = data?.documents;

        if (documents) {
            // TOOLTIP
            const tooltip = selection
                .append("div")
                .style("position", "absolute")
                .style("visibility", "hidden")
                .style("color", "white")
                .style("padding", "8px")
                .style("background-color", "#5b9def")
                .style("border-radius", "6px")
                .style("font-family", "monospace")
                .style("width", "400px")
                .text("");

            this.chartSelection = selection;
            let svg = selection.selectAll<SVGSVGElement, unknown>('svg');
            
            if (svg.empty()) {
                svg = selection.append<SVGSVGElement>("svg");
            }

            this.chartSVG = svg as d3.Selection<SVGSVGElement, unknown, d3.BaseType, unknown>;

            // Color Mapping
            let colorBars: d3.ScaleOrdinal<string, string> | d3.ScaleLinear<number, string>;
            
            if (!this.customColors) {
                colorBars = d3.scaleOrdinal(d3.schemeCategory10);
            } else {
                let min = Infinity;
                let max = -Infinity;
                
                documents.forEach(d => {
                    const value = d[this.attrColors];
                    if (value !== undefined) {
                        if (value < min) min = value;
                        if (value > max) max = value;
                    }
                });

                this.colorDomain = [min, (min + max) / 2, max];
                colorBars = d3.scaleLinear<string>()
                    .domain(this.colorDomain)
                    .range(this.customRange || ["#59f442", "#eef441", "#f44141"]);
            }

            // SET THE SCALES:
            const x = d3.scaleBand()
                .range([0, this.width])
                .padding(0.1);

            const y = d3.scaleLinear()
                .range([this.height, 0]);

            svg.attr("width", this.width + this.margin.left + this.margin.right)
                .attr("height", this.height + this.margin.top + this.margin.bottom)
                .append("g")
                .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

            // Scale the range of the data in the domains
            x.domain(documents.map(d => d.title));
            
            const maxY = d3.max(documents, d => {
                const value = d[this.attrHeight];
                return value !== undefined ? value : 0;
            }) || 0;
            
            y.domain([0, maxY]);

            // Append the rectangles for the bar chart
            const bars = svg.selectAll<SVGRectElement, DocumentData>(".bar")
                .data(documents)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", d => (x(d.title) || 0) + this.margin.left)
                .attr("width", x.bandwidth())
                .attr("y", d => {
                    const value = d[this.attrHeight];
                    return y(value !== undefined ? value : 0) + 10;
                })
                .attr("height", d => {
                    const value = d[this.attrHeight];
                    return this.height - y(value !== undefined ? value : 0);
                })
                .style("fill", d => {
                    if (this.customColors && this.attrColors in d) {
                        return (colorBars as d3.ScaleLinear<number, string>)(d[this.attrColors] as number);
                    }
                    return (colorBars as d3.ScaleOrdinal<string, string>)(d.title);
                })
                .style("stroke", this.strokeColor)
                .style("stroke-width", this.strokeSize)
                .on("mouseover", function(event, d) {
                    tooltip.html(`${d.title}<br/>${d.snippet}`);
                    d3.select(this).style("stroke", "yellow");
                    return tooltip.style("visibility", "visible");
                })
                .on("mousemove", function(event) {
                    return tooltip
                        .style("top", `${event.pageY - 10}px`)
                        .style("left", `${event.pageX + 10}px`);
                })
                .on("mouseout", function() {
                    if (d3.select(this).attr("class") === "visited") {
                        d3.select(this).style("stroke", "blue");
                    } else {
                        d3.select(this).style("stroke", "black");
                    }
                    return tooltip.style("visibility", "hidden");
                })
                .on("click", (event, d) => {
                    window.open(d.link, '_blank', 'top=50,left=50,width=900,height=600');
                    d3.select(event.currentTarget)
                        .attr("class", "visited")
                        .style("stroke", "blue");
                });

            // Create the axis
            const xAxis = d3.axisBottom(x);
            const yAxis = d3.axisLeft(y);

            // Add x axis
            if (selection.select("#xAxis").empty()) {
                svg.append("g")
                    .attr("id", "xAxis")
                    .attr("transform", `translate(${this.margin.left},${this.height + 10})`)
                    .call(xAxis)
                    .selectAll<SVGTextElement, unknown>("text")
                    .attr("y", 10)
                    .attr("x", 9)
                    .attr("dy", ".35em")
                    .attr("transform", "rotate(60)")
                    .style("text-anchor", "start");
            } else {
                svg.select<SVGGElement>("#xAxis")
                    .transition()
                    .duration(this.transition)
                    .call(xAxis)
                    .selectAll<SVGTextElement, unknown>("text")
                    .attr("y", 10)
                    .attr("x", 9)
                    .attr("dy", ".35em")
                    .attr("transform", "rotate(60)")
                    .style("text-anchor", "start");
            }

            // Add y axis
            if (selection.select("#yAxis").empty()) {
                svg.append("g")
                    .attr("id", "yAxis")
                    .attr("transform", `translate(${this.margin.left},10)`)
                    .call(yAxis)
                    .selectAll<SVGTextElement, unknown>("text")
                    .attr("y", 0)
                    .attr("x", -this.margin.left)
                    .attr("dy", ".35em")
                    .attr("transform", "rotate(0)")
                    .style("text-anchor", "start");
            } else {
                svg.select<SVGGElement>("#yAxis")
                    .transition()
                    .duration(this.transition)
                    .call(yAxis)
                    .selectAll<SVGTextElement, unknown>("text")
                    .attr("y", 0)
                    .attr("x", -this.margin.left)
                    .attr("dy", ".35em")
                    .attr("transform", "rotate(0)")
                    .style("text-anchor", "start");
            }

            // UPDATE OF THE CHART
            const update = svg.selectAll<SVGRectElement, DocumentData>(".bar")
                .data(documents);

            update.transition()
                .duration(this.transition)
                .attr("y", d => {
                    const value = d[this.attrHeight];
                    return y(value !== undefined ? value : 0) + 10;
                })
                .attr("height", d => {
                    const value = d[this.attrHeight];
                    return this.height - y(value !== undefined ? value : 0);
                })
                .style("fill", d => {
                    if (this.customColors && this.attrColors in d) {
                        return (colorBars as d3.ScaleLinear<number, string>)(d[this.attrColors] as number);
                    }
                    return (colorBars as d3.ScaleOrdinal<string, string>)(d.title);
                });

            return this;
        }
        
        return this;
    }

    // Configuration methods with method chaining
    public chartWidth(value?: number): number | BarChart {
        if (value === undefined) return this.width;
        this.width = value;
        return this;
    }

    public chartHeight(value?: number): number | BarChart {
        if (value === undefined) return this.height;
        this.height = value;
        return this;
    }

    public chartTitle(value?: string): string | BarChart {
        if (value === undefined) return this.title || '';
        this.title = value;
        return this;
    }

    public chartMinHeight(value?: number): number | BarChart {
        if (value === undefined) return this.minHeight;
        this.minHeight = value;
        return this;
    }

    public chartAttrHeight(value?: string): string | BarChart {
        if (value === undefined) return this.attrHeight;
        this.attrHeight = value;
        return this;
    }

    public chartMaxHeight(value?: number): number | BarChart {
        if (value === undefined) return this.maxHeight;
        this.maxHeight = value;
        return this;
    }

    public chartTransition(value?: number): number | BarChart {
        if (value === undefined) return this.transition;
        this.transition = value;
        return this;
    }

    public chartCustomColors(attr: string, palette?: string[], blindsafe?: boolean): BarChart {
        this.customColors = true;
        this.attrColors = attr;
        this.customRange = palette || ["#59f442", "#eef441", "#f44141"];
        return this;
    }

    public chartRemove(callback?: () => void): BarChart {
        if (!this.chartSVG) return this;

        this.chartSVG.selectAll<SVGTextElement, unknown>("text")
            .style("opacity", "1")
            .transition()
            .duration(500)
            .style("opacity", "0")
            .remove();

        this.chartSVG.selectAll<SVGRectElement, unknown>("rect")
            .style("opacity", "1")
            .transition()
            .duration(500)
            .style("opacity", "0")
            .remove();

        if (!callback) {
            this.chartSVG.selectAll<SVGGElement, unknown>("g")
                .style("opacity", "1")
                .transition()
                .duration(500)
                .style("opacity", "0")
                .remove();
        } else {
            this.chartSVG.selectAll<SVGGElement, unknown>("g")
                .style("opacity", "1")
                .transition()
                .duration(500)
                .style("opacity", "0")
                .remove()
                .on("end", callback);
        }

        return this;
    }
}

// Export as module
export const barChart = (): BarChart => new BarChart();
