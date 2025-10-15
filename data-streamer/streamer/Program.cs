using System;
using Streaming.Models;

namespace streamer
{
    public class Program
    {
          static void Main(string[] args)
          {
               Console.WriteLine("Hello, World!");
               Streamer streamer = new Streamer
               {
                    Id = 1,
                    TopicName = "credit-card-transactions",
                    Url = "b-1.mskdemoforpubliccluste.s6501n.c5.kafka.eu-west-1.amazonaws.com:9098"
               };
               Console.WriteLine(streamer.ToString());
               streamer.Start();
               Console.ReadLine();
               streamer.Stop();
          }
        
    }
}