import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface MarqueeTitleProps {
    title: string;
    classNames: string;
}

export function MarqueeTitle(props: MarqueeTitleProps) {
    const [titleAnimate, setTitleAnimate] = useState<boolean>(false);
    const [boxWidth, setBoxWidth] = useState(150);
    const titleDivRef = useRef<HTMLDivElement>(null);
    const titleSpanRef = useRef<HTMLSpanElement>(null);

    const handleTitleAnimate = (state: boolean) => {
        setTitleAnimate(state);
    };

    useLayoutEffect(() => {
        const handleResize = () => {
            const width = titleDivRef.current?.getBoundingClientRect().width;
            setBoxWidth(width ?? 150);
        };

        if (titleDivRef.current) {
            const width = titleDivRef.current.getBoundingClientRect().width;
            setBoxWidth(width);

            window.addEventListener('resize', handleResize);
        }

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        handleTitleAnimate(textWrapAnimate());
    }, [boxWidth]);

    function textWrapAnimate() {
        if (!titleSpanRef.current || !titleDivRef.current) {
            return false;
        }
        if (props.title.length < 17) {
            return false;
        }
        else {
            const boxLength = Math.ceil((titleDivRef.current.getBoundingClientRect()).width);
            if (boxLength > 170 && props.title.length < 19) {
                return false;
            }
            return true;
        }
    };

    return (
        <div ref={titleDivRef} className={`${titleAnimate ? ('fadeout-horizontal' + " ") : ''}` + "col-span-full row-start-1 row-end-2 flex-row text-center px-2 py-2"}>
            <span ref={titleSpanRef} className={`${titleAnimate ? ('marquee-text-track' + " ") : ''}` + `${props.classNames}`}>
                <p>{props.title}</p>
                <p hidden={ !titleAnimate } aria-hidden="true">{props.title}</p>
            </span>
        </div>
    );
}