"use client";

import { type HTMLMotionProps, motion, type Transition } from "motion/react";
import { Tabs as TabsPrimitive } from "radix-ui";
import * as React from "react";
import {
    MotionHighlight,
    MotionHighlightItem,
} from "@/components/animate-ui/effects/motion-highlight";
import { cn } from "@/lib/utils/ui";

type TabsProps = React.ComponentProps<typeof TabsPrimitive.Root>;

function Tabs({ className, ...props }: TabsProps) {
    return (
        <TabsPrimitive.Root
            className={cn("flex flex-col gap-2", className)}
            data-slot="tabs"
            {...props}
        />
    );
}

type TabsListProps = React.ComponentProps<typeof TabsPrimitive.List> & {
    activeClassName?: string;
    transition?: Transition;
};

function TabsList({
    ref,
    children,
    className,
    activeClassName,
    transition = {
        type: "spring",
        stiffness: 200,
        damping: 25,
    },
    ...props
}: TabsListProps) {
    const localRef = React.useRef<HTMLDivElement | null>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);

    const [activeValue, setActiveValue] = React.useState<string | undefined>(
        undefined,
    );

    const getActiveValue = React.useCallback(() => {
        if (!localRef.current) {
            return;
        }
        const activeTab = localRef.current.querySelector<HTMLElement>(
            '[data-state="active"]',
        );
        if (!activeTab) {
            return;
        }
        setActiveValue(activeTab.getAttribute("data-value") ?? undefined);
    }, []);

    React.useEffect(() => {
        getActiveValue();

        const observer = new MutationObserver(getActiveValue);

        if (localRef.current) {
            observer.observe(localRef.current, {
                attributes: true,
                childList: true,
                subtree: true,
            });
        }

        return () => {
            observer.disconnect();
        };
    }, [getActiveValue]);

    return (
        <MotionHighlight
            className={cn(
                "rounded-sm bg-background shadow-sm",
                activeClassName,
            )}
            controlledItems
            transition={transition}
            value={activeValue}
        >
            <TabsPrimitive.List
                className={cn(
                    "inline-flex h-10 w-fit items-center justify-center rounded-lg bg-muted p-[4px] text-muted-foreground",
                    className,
                )}
                data-slot="tabs-list"
                ref={localRef}
                {...props}
            >
                {children}
            </TabsPrimitive.List>
        </MotionHighlight>
    );
}

type TabsTriggerProps = React.ComponentProps<typeof TabsPrimitive.Trigger>;

function TabsTrigger({ className, value, ...props }: TabsTriggerProps) {
    return (
        <MotionHighlightItem className="size-full" value={value}>
            <TabsPrimitive.Trigger
                className={cn(
                    "z-[1] inline-flex size-full cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-2 py-1 font-medium text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground",
                    className,
                )}
                data-slot="tabs-trigger"
                value={value}
                {...props}
            />
        </MotionHighlightItem>
    );
}

type TabsContentProps = React.ComponentProps<typeof TabsPrimitive.Content> &
    HTMLMotionProps<"div"> & {
        transition?: Transition;
    };

function TabsContent({
    className,
    children,
    transition = {
        duration: 0.5,
        ease: "easeInOut",
    },
    ...props
}: TabsContentProps) {
    return (
        <TabsPrimitive.Content asChild {...props}>
            <motion.div
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                className={cn("flex-1 outline-none", className)}
                data-slot="tabs-content"
                exit={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                initial={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                layout
                transition={transition}
                {...props}
            >
                {children}
            </motion.div>
        </TabsPrimitive.Content>
    );
}

type TabsContentsProps = HTMLMotionProps<"div"> & {
    children: React.ReactNode;
    className?: string;
    transition?: Transition;
};

function TabsContents({
    children,
    className,
    transition = { type: "spring", stiffness: 200, damping: 25 },
    ...props
}: TabsContentsProps) {
    const containerRef = React.useRef<HTMLDivElement | null>(null);

    const [height, setHeight] = React.useState(0);

    React.useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const resizeObserver = new ResizeObserver((entries) => {
            const newHeight = entries?.[0]?.contentRect.height;
            if (!newHeight) {
                return;
            }
            requestAnimationFrame(() => {
                setHeight(newHeight);
            });
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    React.useLayoutEffect(() => {
        if (containerRef.current) {
            const initialHeight =
                containerRef.current.getBoundingClientRect().height;
            setHeight(initialHeight);
        }
    }, []);

    return (
        <motion.div
            animate={{ height: height }}
            className={className}
            data-slot="tabs-contents"
            layout
            transition={transition}
            {...props}
        >
            <div ref={containerRef}>{children}</div>
        </motion.div>
    );
}

export {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    TabsContents,
    type TabsProps,
    type TabsListProps,
    type TabsTriggerProps,
    type TabsContentProps,
    type TabsContentsProps,
};
