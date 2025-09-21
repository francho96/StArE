const color5Lv_A: string[] = ["#59f442", "#c1f441", "#eef441", "#f4b841", "#f44141"];
const color3Lv_A: string[] = ["#59f442", "#eef441", "#f44141"];

const color5LvBS_A: string[] = ["#01a010", "#96cc9b", "#c6b1d1", "#ca63ff", "#7913ad"];
const color3LvBS_A: string[] = ["#96cc9b", "#a29fa3", "#ca63ff"];

let blindsafe: boolean = false;

type PaletteOption = "A5" | "A3";

const get_Palette = (option: PaletteOption, blindsafe: boolean): string[] => {
    if (blindsafe) {
        switch (option) {
            case "A5":
                return color5LvBS_A;
            case "A3":
                return color3LvBS_A;
        }
    } else {
        switch (option) {
            case "A5":
                return color5Lv_A;
            case "A3":
                return color3Lv_A;
        }
    }
};

export { get_Palette, blindsafe };
