import SimplePubSub from "@hck23/simple-q";
import { useId, useState } from "react";
import { Button } from "../../../demo3/src/components/Button";

export function LiveData() {
  let id = useId();
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [form_data, setFormData] = useState({ api_key: "", channel_id: "channel_1" });
  const [live_data, setLiveData] = useState([]);
  console.log(live_data);

  const handleSubscribe = (api_key, channel_id) => {
    (async () => {
      setLoading(true);
      const simpleq = SimplePubSub.init("091d6cw8whdvpr1njbn6xyrbzp4vftxf30xdcxoy9nse3n7fn8");

      try {
        await simpleq.subscribe("channel_2", (message) => {
          console.log("LiveData.jsx #18: ", message);
          setData((prev) => {
            const sliced = prev.slice(0, 50);
            return [message, ...sliced];
          });
        });
        setSubscribed(true);
      } catch (error) {
        setSubscribed(false);
        console.log(err);
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubscribe(form_data.api_key, form_data.channel_id);
      }}>
      <div className="relative isolate mt-6 flex items-center pr-1">
        <label htmlFor={id} className="sr-only">
          Api key
        </label>
        <input
          required
          type="text"
          name="api_key"
          value={form_data.api_key}
          id={id}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, api_key: e.target.value }));
          }}
          placeholder="Api key..."
          className="peer w-0 flex-auto bg-transparent px-4 py-2.5 text-base text-white placeholder:text-gray-500 focus:outline-none sm:text-[0.8125rem]/6"
        />
        <div className="absolute inset-0 -z-10 rounded-lg transition peer-focus:ring-4 peer-focus:ring-sky-300/15" />
        <div className="absolute inset-0 -z-10 rounded-lg bg-white/2.5 ring-1 ring-white/15 transition peer-focus:ring-sky-300" />
      </div>
      <div className="relative isolate mt-6 flex items-center pr-1">
        <label htmlFor={id} className="sr-only">
          Channel id
        </label>
        <input
          required
          type="text"
          name="channel_id"
          value={form_data.channel_id}
          id={id}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, channel_id: e.target.value }));
          }}
          placeholder="Channel id..."
          className="peer w-0 flex-auto bg-transparent px-4 py-2.5 text-base text-white placeholder:text-gray-500 focus:outline-none sm:text-[0.8125rem]/6"
        />
        <div className="absolute inset-0 -z-10 rounded-lg transition peer-focus:ring-4 peer-focus:ring-sky-300/15" />
        <div className="absolute inset-0 -z-10 rounded-lg bg-white/2.5 ring-1 ring-white/15 transition peer-focus:ring-sky-300" />
      </div>
      <div className="mt-6 flex justify-end">
        <Button disable={loading || subscribed}>{subscribed ? "Subscribed" : "Listen"}</Button>
      </div>
    </form>
  );
}
