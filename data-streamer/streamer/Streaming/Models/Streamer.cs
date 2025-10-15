using System;
using System.Data.Common;
using System.Reflection.Metadata;
using Confluent.Kafka;

namespace Streaming.Models
{

     public interface IDataStreamer
     {
          void Start();
          void Stop();

          void OnDataReceived(object data);
     }


     public class Streamer : IDataStreamer

     {
          public int Id { get; set; }
          public string TopicName { get; set; }
          public string Url { get; set; }
          public event EventHandler DataReceived;


          private CancellationTokenSource _cancellationToken;
          private Task ListenerTask;
          private IConsumer<Ignore, string> KafkaConnection;


          public void Start()
          {
               Console.WriteLine("Streaming started.");
               var consumer = CreateConsumer();
               KafkaConnection = consumer;
               consumer.Subscribe(TopicName);
               var cts = new CancellationTokenSource();
               _cancellationToken = cts;
               ListenerTask = Task.Run(() =>
               {
                    try
                    {
                         while (cts.Token.IsCancellationRequested == false)
                         {
                              var consumeResult = consumer.Consume();
                              System.Console.WriteLine($"Message: {consumeResult.Message.Value} received from {consumeResult.TopicPartitionOffset}");
                              OnDataReceived(consumeResult.Message.Value);
                         }
                    }
                    catch (OperationCanceledException)
                    {
                         consumer.Close();
                    }
               });
               
               
          }

          private object ConnectToKafkaTopic(string topicName)
          {
               // Simulate connecting to a Kafka topic
               Console.WriteLine($"Connecting to Kafka topic: {topicName}");
               return new object(); // Placeholder for actual connection object
          }

          public void Stop()
          {
               _cancellationToken?.Cancel();
               Console.WriteLine("Streaming stopped.");

               
          }

          public override string ToString()
          {
               return $"Id: {Id}, TopicName: {TopicName}, Url: {Url}";
          }

          private ConsumerConfig GetConsumerConfig()
          {
               return new ConsumerConfig
               {
                    //BootstrapServers = "54.195.167.195:8080",
                    BootstrapServers = Url,
                    GroupId = "tlb-consumer",
                    AutoOffsetReset = AutoOffsetReset.Earliest
               };
          }

          private IConsumer<Ignore, string> CreateConsumer()
          {
               var config = GetConsumerConfig();
               return new ConsumerBuilder<Ignore, string>(config).Build();
          }

          private void OnDataReceived(object data)
          {
               DataReceived?.Invoke(this, EventArgs.Empty);
          }

          void IDataStreamer.OnDataReceived(object data)
          {
               OnDataReceived(data);
          }
     }
    

    public class DataPersister<T>
    {
        public void Save(T item)
        {
            // Logic to save the item
            Console.WriteLine($"Saving item of type {typeof(T).Name}");
        }
    }
}