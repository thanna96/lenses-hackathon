#!/usr/bin/env python3
import argparse
import sys
from typing import Dict, Any

try:
    from confluent_kafka.admin import AdminClient
except ImportError:
    sys.stderr.write("confluent_kafka is required. Install with: pip install confluent-kafka\n")
    sys.exit(1)


def build_config(args: argparse.Namespace) -> Dict[str, Any]:
    config: Dict[str, Any] = {
        "bootstrap.servers": args.bootstrap_servers,
    }

    if args.security_protocol:
        config["security.protocol"] = args.security_protocol

    if args.sasl_mechanism:
        config["sasl.mechanism"] = args.sasl_mechanism
    if args.sasl_username:
        config["sasl.username"] = args.sasl_username
    if args.sasl_password:
        config["sasl.password"] = args.sasl_password

    if args.ssl_ca_location:
        config["ssl.ca.location"] = args.ssl_ca_location
    if args.ssl_certificate_location:
        config["ssl.certificate.location"] = args.ssl_certificate_location
    if args.ssl_key_location:
        config["ssl.key.location"] = args.ssl_key_location
    if args.ssl_key_password:
        config["ssl.key.password"] = args.ssl_key_password

    return config


def list_topics(config: Dict[str, Any]) -> None:
    admin = AdminClient(config)
    md = admin.list_topics(timeout=10)

    topic_names = sorted(t.topic for t in md.topics.values())
    for name in topic_names:
        print(name)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="List Kafka topics")
    parser.add_argument(
        "--bootstrap-servers",
        required=True,
        help="Comma-separated host:port pairs of Kafka brokers",
    )

    parser.add_argument(
        "--security-protocol",
        choices=["PLAINTEXT", "SSL", "SASL_PLAINTEXT", "SASL_SSL"],
        help="Security protocol to use",
    )
    parser.add_argument("--sasl-mechanism", help="SASL mechanism (e.g., PLAIN, SCRAM-SHA-512)")
    parser.add_argument("--sasl-username", help="SASL username or API key")
    parser.add_argument("--sasl-password", help="SASL password or API secret")

    parser.add_argument("--ssl-ca-location", help="Path to CA certificate file")
    parser.add_argument("--ssl-certificate-location", help="Path to client certificate")
    parser.add_argument("--ssl-key-location", help="Path to client private key")
    parser.add_argument("--ssl-key-password", help="Private key password if encrypted")

    return parser.parse_args()


def main() -> None:
    args = parse_args()
    try:
        config = build_config(args)
        list_topics(config)
    except Exception as exc:
        sys.stderr.write(f"Error listing topics: {exc}\n")
        sys.exit(2)


if __name__ == "__main__":
    main()


