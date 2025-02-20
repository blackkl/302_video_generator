"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import FormGenerator from "@/components/common/form-generator";
import { ImageCropper } from "@/components/common/image-cropper";
import { Button } from "@/components/ui/button";
import { FORM_CONSTANTS, OPTION_CONSTANTS } from "@/constants";
import { OptionProps } from "@/constants/options";
import { useClientTranslation } from "@/hooks/global";
import { cn } from "@/lib/utils";
import { useFormStore, useTaskStore } from "@/stores";
import { TaskType } from "@/stores/slices/task-slice";

import type { VideoFormKey } from "./schema";
import { VideoSchema } from "./schema";

type DefaultVideoData = {
  model: string;
  prompt: string;
  firstFile: null | File;
  lastFile: null | File;
  firstFrame: null | File;
  lastFrame: null | File;
  ratio?: string;
  type?: string;
  time?: string;
  loop?: string;
  camera?: string;
  audio?: string;
  style?: string;
};

type VideoFormProps = {
  disabled?: boolean;
  className?: string;
};

const VideoForm = ({ className, disabled = false }: VideoFormProps) => {
  const addTask = useTaskStore((state) => state.addTask);
  const [isReady, setIsReady] = useState(false);
  const [showFields, setShowFields] = useState<string[]>([]);
  const [isNeedRatio, setIsNeedRatio] = useState(false);
  const [isResize, setIsResize] = useState(false);
  const [ratioOptions, setRatioOptions] = useState<OptionProps[]>(
    OPTION_CONSTANTS.defaultVideoOption
  );
  const { t } = useClientTranslation();

  const videoForm = useFormStore((state) => state.videoFormState.formData);

  const {
    watch,
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<DefaultVideoData>({
    defaultValues: videoForm,
    resolver: zodResolver(VideoSchema),
  });

  const modelValue = watch("model");
  const promptValue = watch("prompt");
  const typeValue = watch("type");
  const firstFile = watch("firstFile");
  const lastFile = watch("lastFile");

  useEffect(() => {
    setIsReady(!!(firstFile || lastFile || promptValue));

    if (!firstFile) setValue("firstFrame", null);
    if (!lastFile) setValue("lastFrame", null);

    if (["kling", "pika"].includes(modelValue) || firstFile || lastFile) {
      setIsNeedRatio(true);
    }

    setIsResize(modelValue === "runway");

    switch (modelValue) {
      case "luma":
        setRatioOptions(OPTION_CONSTANTS.lumaVideoOption);
        setShowFields([
          "model",
          "prompt",
          "firstFile",
          "firstFrame",
          "lastFile",
          "lastFrame",
          "camera",
          "loop",
        ]);
        break;
      case "kling":
        setRatioOptions(OPTION_CONSTANTS.klingVideoOption);
        if (typeValue === "fast" || firstFile || lastFile) {
          setValue("time", "5s");
          setShowFields([
            "model",
            "prompt",
            "firstFile",
            "firstFrame",
            "lastFile",
            "lastFrame",
            "ratio",
            "type",
          ]);
        } else {
          setShowFields([
            "model",
            "prompt",
            "firstFile",
            "firstFrame",
            "lastFile",
            "lastFrame",
            "ratio",
            "type",
            "time",
          ]);
        }
        break;
      case "runway":
        setRatioOptions(OPTION_CONSTANTS.runwayVideoOption);
        if (firstFile || lastFile) {
          setShowFields([
            "model",
            "prompt",
            "firstFile",
            "firstFrame",
            "lastFile",
            "lastFrame",
            "type",
            "time",
          ]);
        } else {
          setShowFields([
            "model",
            "prompt",
            "firstFile",
            "firstFrame",
            "lastFile",
            "lastFrame",
            "time",
          ]);
        }
        break;
      case "cog":
        setRatioOptions(OPTION_CONSTANTS.cogVideoOption);
        setShowFields(["model", "prompt", "firstFile", "firstFrame"]);
        break;
      case "minimax":
        setRatioOptions(OPTION_CONSTANTS.minimaxVideoOption);
        setShowFields(["model", "prompt", "firstFile", "firstFrame"]);
        break;
      case "pika":
        setRatioOptions(OPTION_CONSTANTS.pikaVideoOption);
        setShowFields([
          "model",
          "prompt",
          "firstFile",
          "firstFrame",
          "ratio",
          "style",
          "audio",
        ]);
        break;
      case "genmo":
        setShowFields(["model", "prompt"]);
        break;
      default:
        setRatioOptions(OPTION_CONSTANTS.defaultVideoOption);
        setShowFields([
          "model",
          "prompt",
          "firstFile",
          "lastFile",
          "firstFrame",
          "lastFrame",
          "ratio",
          "type",
          "time",
          "loop",
          "audio",
          "camera",
          "style",
        ]);
        break;
    }
  }, [modelValue, promptValue, typeValue, firstFile, lastFile, setValue]);

  useEffect(() => {
    Object.entries(videoForm).forEach(([key, value]) =>
      setValue(key as VideoFormKey, value)
    );
  }, [videoForm, setValue]);

  const _onSubmit = (data: DefaultVideoData) => {
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => showFields.includes(key))
    );
    addTask(filteredData, TaskType.VIDEO_GENERATION);
  };

  const handleCropConfirm = (data: {
    firstFrame: File | null;
    lastFrame: File | null;
    ratio: string;
  }) => {
    Object.entries(data).forEach(([key, value]) => {
      setValue(key as VideoFormKey, value);
    });
    handleSubmit(_onSubmit)();
  };

  return (
    <form
      className={cn("grid w-full items-center gap-4", className)}
      onSubmit={handleSubmit(_onSubmit)}
    >
      {FORM_CONSTANTS.videoForm.map((field) => (
        <FormGenerator
          {...field}
          key={field.id}
          watch={watch}
          register={register}
          getValues={getValues}
          setValue={setValue}
          errors={errors}
          className={cn("flex flex-col space-y-1.5", {
            hidden: !showFields.includes(field.name),
          })}
        />
      ))}
      {isNeedRatio ? (
        <ImageCropper
          disable={disabled || !isReady}
          ratioOptions={ratioOptions}
          originFirstFile={firstFile}
          originLastFile={lastFile}
          resize={isResize}
          confirm={handleCropConfirm}
        />
      ) : (
        <Button disabled={disabled || !isReady} type="submit">
          {t("v-gen:action.create_video")}
        </Button>
      )}
    </form>
  );
};

export default VideoForm;
