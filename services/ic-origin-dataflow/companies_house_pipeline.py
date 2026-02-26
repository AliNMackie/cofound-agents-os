import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
import argparse
import logging

def run(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', dest='input', help='Input for processing')
    parser.add_argument('--output', dest='output', help='Output for results')
    args, beam_args = parser.parse_known_args(argv)

    options = PipelineOptions(beam_args)
    with beam.Pipeline(options=options) as p:
        (p | 'ReadFromSource' >> beam.Create(['Companies House Data Stub'])
           | 'ProcessSignals' >> beam.Map(lambda x: f"Processed: {x}")
           | 'WriteToBigQuery' >> beam.Map(logging.info))

if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    run()
