import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getWebAppUrl, setWebAppUrl } from "@/lib/attendance-api";

export function SettingsDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setUrl(getWebAppUrl());
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="size-12 shrink-0 rounded-2xl"
          aria-label="Connect Google Sheet"
        >
          <Settings2 className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Connect your Google Sheet</DialogTitle>
          <DialogDescription>
            Paste the Google Apps Script Web App URL (deployed with access “Anyone”). Leave empty to
            keep using sample data.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="webapp">Web App URL</Label>
          <Input
            id="webapp"
            inputMode="url"
            placeholder="https://script.google.com/macros/s/.../exec"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-12 rounded-2xl"
          />
        </div>
        <DialogFooter>
          <Button
            className="h-12 rounded-2xl"
            onClick={() => {
              setWebAppUrl(url);
              setOpen(false);
              onSaved();
            }}
          >
            Save & reload data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
