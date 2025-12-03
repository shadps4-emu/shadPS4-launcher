import { useEffect, useRef, useState } from "react";

interface MarqueeTitleProps {
    title: string;
    classNames: string;
}

export function MarqueeTitle(props: MarqueeTitleProps) {
    const [transformLimit, setTransformLimit] = useState(0);
    const [titleBoxWidth, setTitleBoxWidth] = useState(150);
    const [titleAnimate, setTitleAnimate] = useState<Boolean>(false);
    const [windowWidth, setWindowWidth] = useState(0.0);
    const textTitleRef = useRef<HTMLSpanElement>(null);

    const updateDimensions = () => {
        setWindowWidth(textTitleRef.current!.clientWidth)
    };

    const handleTransformLimit = (num: number) => {
        if (num != transformLimit) {
            setTransformLimit(num);
        }
    };

    const handleTitleBoxWidth = (num: number) => {
        if (num != titleBoxWidth) {
            setTitleBoxWidth(num);
        }
    };

    const handleTitleAnimate = (state: boolean) => {
        if (state != titleAnimate) {
            setTitleAnimate(state);
        }
    };

    const marqueeTransformStyle = {
        '--transform-final': `${transformLimit}px`,
    } as React.CSSProperties;

    useEffect(() => {
        if (textTitleRef.current) {
            window.addEventListener("resize", updateDimensions);
        }
        
        return () => {
            window.removeEventListener("resize", updateDimensions);
        };
    }, [textTitleRef]);

    useEffect(() => {
        handleTitleAnimate(textWrapAnimate());
    }, [windowWidth]);

    function textWrapAnimate() {
        if (textTitleRef.current) {
            if (props.title.length >= 17) {
                const boxLength = Math.ceil((textTitleRef.current.getBoundingClientRect()).width);
                if (boxLength > 170 && props.title.length < 19) {
                    return false;
                }
                handleTitleBoxWidth(boxLength);
                const upper = (props.title.match(/[A-Z]/g) || []).length;
                const special = (props.title.match(/[\s\W]/g) || []).length;
                const lower = props.title.length - (upper + special);
                const fit = Math.ceil(
                    (((titleBoxWidth * 0.15 + (upper * 18) + (lower * 17) + (special * 20) + titleBoxWidth) +
                        ((props.title.length - 20) * 50)) / (titleBoxWidth * 0.85)) * 18);

                handleTransformLimit(-fit);
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    };

    return (
        <span ref={textTitleRef} className={`${titleAnimate ? ('animate-marquee' + " ") : ''}` + `${props.classNames}`}
            style={marqueeTransformStyle}
        >
            {props.title}
        </span>
    );
}