type SelectableAnchor =
    | "TOP_LEFT"
    | "TOP_CENTER"
    | "TOP_RIGHT"
    | "CENTER_LEFT"
    | "CENTER"
    | "CENTER_RIGHT"
    | "BOTTOM_LEFT"
    | "BOTTOM_CENTER"
    | "BOTTOM_RIGHT";

declare module "react" {
    export interface HTMLAttributes {
        "data-gamepad-selectable"?: boolean | SelectableAnchor;
    }
}

export {};
