import { installNewVersion } from "@/handlers/version-manager";
import { atomEmuInstallsPath } from "@/store/paths";
import {
  atomAvailableVersions,
  atomInstalledVersions,
  atomModalVersionManagerIsOpen,
  type RemoteEmulatorVersion,
} from "@/store/version-manager";
import { format } from "date-fns";
import { useAtom, useAtomValue, useStore } from "jotai";
import { Check, CircleSlash, Plus } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Spinner } from "./ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

function VersionTableRow({
  source,
  date,
  version,
  release,
  prePelease: preRelease,
  children,
}: {
  source: string;
  date: string;
  version: string;
  release?: string;
  prePelease?: boolean;
  children?: ReactNode;
}) {
  return (
    <TableRow>
      <TableCell>{source}</TableCell>
      <TableCell>{date}</TableCell>
      <TableCell>{version}</TableCell>
      <TableCell>
        {preRelease === true ? (
          <Badge variant="destructive">Pre-release</Badge>
        ) : (
          release
        )}
      </TableCell>
      {children}
    </TableRow>
  );
}

function DownloadButton({
  version: v,
  onClick,
}: {
  version: RemoteEmulatorVersion;
  onClick: () => void;
}) {
  const installedVersions = useAtomValue(atomInstalledVersions);

  const alreadyInstalled = installedVersions.some(
    (e) => e.repo == v.repo && e.version == v.version,
  );

  if (alreadyInstalled) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="cursor-default hover:bg-inherit"
          >
            {" "}
            <Check />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>Already Installed</span>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (v.notSupported) {
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Button size="icon" variant="outline" disabled>
          <CircleSlash />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <span>Not Supported In Your Platform</span>
      </TooltipContent>
    </Tooltip>;
  }

  return (
    <Button size="icon" variant="outline" onClick={onClick}>
      <Plus />
    </Button>
  );
}

function AddNewVersion() {
  const { data, isLoading, error } = useAtomValue(atomAvailableVersions);
  const rootInstallPath = useAtomValue(atomEmuInstallsPath);
  const store = useStore();

  const install = (v: RemoteEmulatorVersion) => {
    if (rootInstallPath) {
      void installNewVersion(v, rootInstallPath);
    }
    store.set(atomModalVersionManagerIsOpen, false);
  };

  let content = null;
  if (isLoading) {
    content = <Spinner />;
  } else if (error) {
    content = <span className="text-red-500">{error.message}</span>;
  } else {
    content = (
      <Table className="gap-4">
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Release</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((v, i) => (
            <VersionTableRow
              key={i}
              source={v.repo}
              date={format(v.date, "PP")}
              version={v.version}
              release={v.name}
              prePelease={v.prerelease}
            >
              <TableCell>
                <DownloadButton version={v} onClick={() => install(v)} />
              </TableCell>
            </VersionTableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <DialogContent className="min-w-[525px]">
      <DialogHeader>
        <DialogTitle>Add New Version</DialogTitle>
      </DialogHeader>
      <ScrollArea className="max-h-[60vh]">{content}</ScrollArea>
    </DialogContent>
  );
}

export function VersionManagerModal() {
  const [isOpen, setIsOpen] = useAtom(atomModalVersionManagerIsOpen);
  const [isNew, setIsNew] = useState(false);

  const installedVersions = useAtomValue(atomInstalledVersions);

  useEffect(() => {
    if (!isOpen) {
      setIsNew(false);
    }
  }, [isOpen]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {isNew ? (
          <AddNewVersion />
        ) : (
          <DialogContent className="min-w-[525px]">
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center gap-4">
                  <span>Version Manager</span>
                  <Button size="sm" onClick={() => setIsNew(true)}>
                    Add
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="flex">
              <Table className="gap-4">
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Release</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installedVersions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No version installed
                      </TableCell>
                    </TableRow>
                  ) : (
                    installedVersions.map((v, i) => (
                      <VersionTableRow
                        key={i}
                        source={v.repo}
                        date={format(v.date, "PP")}
                        version={v.version}
                        release={v.name}
                        prePelease={v.prerelease}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
