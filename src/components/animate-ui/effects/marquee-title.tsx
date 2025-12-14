import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface MarqueeTitleProps {
    classNames: string;
    title: string;
}

export function MarqueeTitle(props: MarqueeTitleProps) {
    const [titleAnimate, setTitleAnimate] = useState<boolean>(false);
    const [boxWidth, setBoxWidth] = useState(150);
    const titleDivRef = useRef<HTMLDivElement>(null);
    const titleSpanRef = useRef<HTMLSpanElement>(null);

    useLayoutEffect(() => {
        const handleResize = () => {
            const width = titleDivRef.current?.getBoundingClientRect().width;
            setBoxWidth(width ?? 150);
        };

        if (titleDivRef.current) {
            const width = titleDivRef.current.getBoundingClientRect().width;
            setBoxWidth(width);

            window.addEventListener("resize", handleResize);
        }

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        function textWrapAnimate() {
            if (!titleSpanRef.current || !titleDivRef.current) {
                return false;
            }
            if (props.title.length < 17) {
                return false;
            } else {
                const boxLength = Math.ceil(boxWidth);
                if (boxLength > 170 && props.title.length < 19) {
                    return false;
                }
                return true;
            }
        }

        setTitleAnimate(textWrapAnimate());
    }, [boxWidth, props.title]);

    return (
        <div
            className={
                `${titleAnimate ? "fadeout-horizontal" + " " : ""}` +
                "col-span-full row-start-1 row-end-2 flex-row px-2 py-2 text-center"
            }
            ref={titleDivRef}
        >
            <span
                className={
                    `${titleAnimate ? "marquee-text-track" + " " : ""}` +
                    `${props.classNames}`
                }
                ref={titleSpanRef}
            >
                <p>{props.title}</p>
                <p aria-hidden="true" hidden={!titleAnimate}>
                    {props.title}
                </p>
            </span>
        </div>
    );
}
